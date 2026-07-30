#!/usr/bin/env python3
"""
F&F Lab - Python WebSocket Server v3.0
Servidor robusto com suporte multi-perfil (até 8 Chrome profiles simultâneos)
e integração Grok AI para auto-fix de prompts

Requisitos:
    pip install websockets aiohttp

Uso:
    python server.py
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field, asdict
from enum import Enum

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("Erro: websockets não instalado. Execute: pip install websockets")
    sys.exit(1)

try:
    import aiohttp
except ImportError:
    print("Aviso: aiohttp não instalado. Grok AI não funcionará. Execute: pip install aiohttp")
    aiohttp = None

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('FFLab')

# Configurações do servidor
HOST = 'localhost'
PORT = 8765
GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
GROK_MODEL = 'grok-4'
MAX_PROFILES = 8


class ErrorType(Enum):
    POLICY = 'policy'
    TIMEOUT = 'timeout'
    SERVER = 'server'
    RATE_LIMIT = 'rate_limit'
    GENERATION_FAIL = 'generation_fail'
    UNKNOWN = 'unknown'


class PromptStatus(Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    SUCCESS = 'success'
    ERROR = 'error'
    FIXING = 'fixing'
    FIXED = 'fixed'
    FIX_FAILED = 'fix_failed'


@dataclass
class PromptError:
    prompt_number: int
    error_type: ErrorType
    error_message: str
    original_prompt: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class FixedPrompt:
    prompt_number: int
    original_prompt: str
    fixed_prompt: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Job:
    """Representa um job na fila"""
    id: str
    name: str
    download_folder: str
    prompts: List[Dict] = field(default_factory=list)
    status: str = 'queued'  # queued, running, paused, completed, error
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_count: int = 0
    error_count: int = 0


@dataclass
class ClientSession:
    """Estado de sessão para cada cliente/perfil conectado"""
    client_id: str
    profile_name: str
    websocket: WebSocketServerProtocol
    assigned_folder: Optional[int] = None  # Pasta atribuída (1-8)
    grok_api_key: Optional[str] = None
    auto_fix_enabled: bool = True
    errors: List[PromptError] = field(default_factory=list)
    fix_queue: List[Dict] = field(default_factory=list)
    fixed_prompts: List[FixedPrompt] = field(default_factory=list)
    active: bool = False
    total_prompts: int = 0
    completed: int = 0
    error_count: int = 0
    current_layer: str = 'MODO DIRETO'
    connected_at: datetime = field(default_factory=datetime.now)
    job_counter: int = 0  # Contador de jobs para este perfil
    job_queue: List[Job] = field(default_factory=list)  # Fila de jobs
    current_job_id: Optional[str] = None  # ID do job atual em execução


class FFLabServer:
    """Servidor WebSocket para F&F Lab com suporte multi-perfil"""

    def __init__(self):
        # Dicionário de sessões por client_id
        self.sessions: Dict[str, ClientSession] = {}
        # Mapeamento websocket -> client_id para lookup rápido
        self.websocket_to_client: Dict[WebSocketServerProtocol, str] = {}
        # Pastas disponíveis (1-8)
        self.available_folders: Set[int] = set(range(1, MAX_PROFILES + 1))
        # Mapeamento client_id -> folder para rastreamento
        self.client_folders: Dict[str, int] = {}

        logger.info("F&F Lab Server v3.0 Multi-Profile inicializado")
        logger.info(f"Suporte para até {MAX_PROFILES} perfis simultâneos")

    def _generate_client_id(self, profile_name: str, extension_id: str) -> str:
        """Gera ID único para cliente baseado em perfil + extensão"""
        return f"{profile_name}_{extension_id}"

    def _assign_folder(self, client_id: str) -> Optional[int]:
        """Atribui uma pasta disponível para o cliente"""
        # Verificar se cliente já tem pasta atribuída
        if client_id in self.client_folders:
            return self.client_folders[client_id]

        # Atribuir menor pasta disponível
        if self.available_folders:
            folder = min(self.available_folders)
            self.available_folders.remove(folder)
            self.client_folders[client_id] = folder
            logger.info(f"Pasta {folder} atribuída para {client_id}")
            return folder
        return None

    def _release_folder(self, client_id: str):
        """Libera a pasta atribuída ao cliente"""
        if client_id in self.client_folders:
            folder = self.client_folders[client_id]
            del self.client_folders[client_id]
            self.available_folders.add(folder)
            logger.info(f"Pasta {folder} liberada (cliente {client_id})")

    def _get_folder_name(self, folder_num: int) -> str:
        """Retorna o nome da pasta para o número dado"""
        if folder_num == 1:
            return 'F&F Lab Videos'
        return f'F&F Lab Videos ({folder_num})'

    def _get_session(self, websocket: WebSocketServerProtocol) -> Optional[ClientSession]:
        """Obtém sessão associada ao websocket"""
        client_id = self.websocket_to_client.get(websocket)
        if client_id:
            return self.sessions.get(client_id)
        return None

    async def register(self, websocket: WebSocketServerProtocol, data: dict):
        """Registra nova conexão de cliente com identificação de perfil"""
        profile_name = data.get('profileName', 'Default')
        extension_id = data.get('extensionId', 'unknown')

        client_id = self._generate_client_id(profile_name, extension_id)

        # Verificar se já existe sessão para este cliente
        if client_id in self.sessions:
            old_session = self.sessions[client_id]
            # Fechar conexão anterior se houver
            if old_session.websocket and old_session.websocket != websocket:
                try:
                    await old_session.websocket.close()
                except:
                    pass
                # Remover mapeamento antigo
                old_ws = None
                for ws, cid in self.websocket_to_client.items():
                    if cid == client_id:
                        old_ws = ws
                        break
                if old_ws:
                    del self.websocket_to_client[old_ws]

            # Atualizar websocket na sessão existente
            old_session.websocket = websocket
            logger.info(f"[{profile_name}] Cliente reconectado. ID: {client_id}")
        else:
            # Verificar limite de perfis
            if len(self.sessions) >= MAX_PROFILES:
                await self._send_to_websocket(websocket, {
                    'type': 'CONNECTION_ERROR',
                    'error': f'Limite de {MAX_PROFILES} perfis atingido'
                })
                logger.warning(f"[{profile_name}] Conexão rejeitada - limite de perfis atingido")
                return False

            # Atribuir pasta
            assigned_folder = self._assign_folder(client_id)
            if assigned_folder is None:
                await self._send_to_websocket(websocket, {
                    'type': 'CONNECTION_ERROR',
                    'error': 'Todas as pastas estao em uso. Desconecte outro perfil primeiro.'
                })
                logger.warning(f"[{profile_name}] Conexão rejeitada - sem pastas disponíveis")
                return False

            # Criar nova sessão
            session = ClientSession(
                client_id=client_id,
                profile_name=profile_name,
                websocket=websocket,
                assigned_folder=assigned_folder
            )
            self.sessions[client_id] = session
            logger.info(f"[{profile_name}] Novo cliente conectado. ID: {client_id}, Pasta: {assigned_folder}")

        # Mapear websocket para client_id
        self.websocket_to_client[websocket] = client_id

        # Enviar status de conexão
        session = self.sessions[client_id]
        await self._send_to_websocket(websocket, {
            'type': 'CONNECTION_STATUS',
            'connected': True,
            'clientId': client_id,
            'profileName': profile_name,
            'layer': session.current_layer,
            'grok_configured': bool(session.grok_api_key),
            'auto_fix_enabled': session.auto_fix_enabled,
            'activeProfiles': len(self.sessions),
            # Folder assignment
            'assignedFolder': session.assigned_folder,
            'folderName': self._get_folder_name(session.assigned_folder) if session.assigned_folder else None
        })

        self._log_active_profiles()
        return True

    async def unregister(self, websocket: WebSocketServerProtocol):
        """Remove conexão de cliente"""
        client_id = self.websocket_to_client.get(websocket)

        if client_id:
            session = self.sessions.get(client_id)
            if session:
                logger.info(f"[{session.profile_name}] Cliente desconectado. ID: {client_id}")

            # Remover mapeamento (mas manter sessão para reconexão)
            del self.websocket_to_client[websocket]

            # Marcar sessão como inativa
            if session:
                session.active = False

            # Liberar pasta após desconexão para permitir reconexão de outros perfis
            # Nota: Em produção, pode-se adicionar um timeout antes de liberar
            self._release_folder(client_id)

            # Remover sessão também para liberar recursos
            if client_id in self.sessions:
                del self.sessions[client_id]

        self._log_active_profiles()

    def _log_active_profiles(self):
        """Log de perfis ativos"""
        active_count = len(self.websocket_to_client)
        total_count = len(self.sessions)
        logger.info(f"Perfis: {active_count} ativos / {total_count} registrados")

        for client_id, session in self.sessions.items():
            connected = session.websocket in self.websocket_to_client
            status = "🟢" if connected else "⚪"
            logger.debug(f"  {status} {session.profile_name} ({client_id})")

    async def _send_to_websocket(self, websocket: WebSocketServerProtocol, data: dict):
        """Envia mensagem para um websocket específico"""
        try:
            await websocket.send(json.dumps(data))
        except websockets.exceptions.ConnectionClosed:
            pass

    async def send_to_client(self, client_id: str, data: dict):
        """Envia mensagem para um cliente específico por ID"""
        session = self.sessions.get(client_id)
        if session and session.websocket:
            await self._send_to_websocket(session.websocket, data)

    async def broadcast_to_all(self, data: dict):
        """Envia mensagem para todos os clientes conectados"""
        for ws in self.websocket_to_client.keys():
            await self._send_to_websocket(ws, data)

    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Processa mensagem recebida do cliente"""
        try:
            data = json.loads(message)
            msg_type = data.get('type', '')

            # REGISTER é especial - precisa processar antes de ter sessão
            if msg_type == 'REGISTER':
                await self.register(websocket, data)
                return

            # Para outros tipos, verificar se tem sessão
            session = self._get_session(websocket)
            if not session:
                # Cliente não registrado - enviar erro
                await self._send_to_websocket(websocket, {
                    'type': 'ERROR',
                    'message': 'Cliente não registrado. Envie REGISTER primeiro.'
                })
                return

            logger.debug(f"[{session.profile_name}] Mensagem: {msg_type}")

            # Handler para cada tipo de mensagem
            handlers = {
                'SET_GROK_API_KEY': self.handle_set_grok_key,
                'SET_AUTO_FIX': self.handle_set_auto_fix,
                'REGISTER_ERROR': self.handle_register_error,
                'FIX_PROMPT': self.handle_fix_prompt,
                'GET_STATUS': self.handle_get_status,
                'START_SESSION': self.handle_start_session,
                'END_SESSION': self.handle_end_session,
                'PING': self.handle_ping,
                'LAYER_UPDATE': self.handle_layer_update,
                'PROGRESS_UPDATE': self.handle_progress_update,
                # Job Queue handlers
                'ADD_JOB': self.handle_add_job,
                'START_JOB': self.handle_start_job,
                'COMPLETE_JOB': self.handle_complete_job,
                'GET_JOB_QUEUE': self.handle_get_job_queue,
                'REMOVE_JOB': self.handle_remove_job,
            }

            handler = handlers.get(msg_type)
            if handler:
                await handler(session, data)
            else:
                logger.warning(f"[{session.profile_name}] Tipo desconhecido: {msg_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao decodificar JSON: {e}")
        except Exception as e:
            logger.error(f"Erro ao processar mensagem: {e}")

    async def handle_ping(self, session: ClientSession, data: dict):
        """Responde ping do cliente"""
        await self._send_to_websocket(session.websocket, {
            'type': 'PONG',
            'clientId': session.client_id,
            'timestamp': datetime.now().isoformat()
        })

    async def handle_set_grok_key(self, session: ClientSession, data: dict):
        """Define API key do Grok para esta sessão"""
        api_key = data.get('apiKey', '')
        session.grok_api_key = api_key if api_key else None
        logger.info(f"[{session.profile_name}] Grok API key {'configurada' if session.grok_api_key else 'removida'}")

        await self._send_to_websocket(session.websocket, {
            'type': 'GROK_STATUS',
            'configured': bool(session.grok_api_key)
        })

    async def handle_set_auto_fix(self, session: ClientSession, data: dict):
        """Define se auto-fix está habilitado para esta sessão"""
        session.auto_fix_enabled = data.get('enabled', True)
        logger.info(f"[{session.profile_name}] Auto-fix: {'habilitado' if session.auto_fix_enabled else 'desabilitado'}")

    async def handle_register_error(self, session: ClientSession, data: dict):
        """Registra erro de prompt para esta sessão"""
        error = PromptError(
            prompt_number=data.get('promptNumber', 0),
            error_type=ErrorType(data.get('errorType', 'unknown')),
            error_message=data.get('errorMessage', ''),
            original_prompt=data.get('originalPrompt', '')
        )

        session.errors.append(error)
        session.error_count += 1

        logger.warning(f"[{session.profile_name}] Erro - Prompt {error.prompt_number}: {error.error_type.value}")

        # Se for erro de política e auto-fix está habilitado
        if (error.error_type == ErrorType.POLICY and
            session.auto_fix_enabled and
            session.grok_api_key):

            session.fix_queue.append({
                'prompt_number': error.prompt_number,
                'original_prompt': error.original_prompt,
                'error_message': error.error_message,
                'status': 'pending'
            })
            logger.info(f"[{session.profile_name}] Prompt {error.prompt_number} na fila de fix")

        # Notificar cliente
        await self._send_to_websocket(session.websocket, {
            'type': 'ERROR_REGISTERED',
            'promptNumber': error.prompt_number,
            'errorType': error.error_type.value,
            'queueSize': len(session.fix_queue)
        })

    async def handle_fix_prompt(self, session: ClientSession, data: dict):
        """Corrige prompt com Grok AI"""
        prompt_number = data.get('promptNumber')
        original_prompt = data.get('originalPrompt', '')
        error_message = data.get('errorMessage', '')

        if not session.grok_api_key:
            await self._send_to_websocket(session.websocket, {
                'type': 'FIX_RESULT',
                'promptNumber': prompt_number,
                'success': False,
                'error': 'Grok API key não configurada'
            })
            return

        logger.info(f"[{session.profile_name}] Corrigindo prompt {prompt_number}...")

        try:
            fixed_prompt = await self.fix_prompt_with_grok(
                session, prompt_number, original_prompt, error_message
            )

            if fixed_prompt:
                session.fixed_prompts.append(FixedPrompt(
                    prompt_number=prompt_number,
                    original_prompt=original_prompt,
                    fixed_prompt=fixed_prompt
                ))

                # Atualizar fila
                for item in session.fix_queue:
                    if item['prompt_number'] == prompt_number:
                        item['status'] = 'fixed'
                        item['fixed_prompt'] = fixed_prompt
                        break

                await self._send_to_websocket(session.websocket, {
                    'type': 'FIX_RESULT',
                    'promptNumber': prompt_number,
                    'success': True,
                    'fixedPrompt': fixed_prompt
                })

                logger.info(f"[{session.profile_name}] Prompt {prompt_number} corrigido!")
            else:
                raise Exception("Resposta vazia do Grok")

        except Exception as e:
            logger.error(f"[{session.profile_name}] Erro fix prompt {prompt_number}: {e}")

            # Atualizar fila
            for item in session.fix_queue:
                if item['prompt_number'] == prompt_number:
                    item['status'] = 'failed'
                    item['error'] = str(e)
                    break

            await self._send_to_websocket(session.websocket, {
                'type': 'FIX_RESULT',
                'promptNumber': prompt_number,
                'success': False,
                'error': str(e)
            })

    async def fix_prompt_with_grok(self, session: ClientSession, prompt_number: int,
                                    original_prompt: str, error_message: str) -> Optional[str]:
        """Chama API do Grok para corrigir prompt"""
        if not aiohttp:
            raise Exception("aiohttp não instalado")

        import re
        elements_match = re.search(r'\[([0-9,\s]+)\]', original_prompt)
        elements_str = elements_match.group(0) if elements_match else ''

        prompt_num_match = re.search(r'PROMPT\s*(\d+)', original_prompt, re.IGNORECASE)
        prompt_prefix = f"PROMPT {prompt_num_match.group(1)}" if prompt_num_match else ''

        clean_prompt = re.sub(r'PROMPT\s*\d+\s*:?\s*', '', original_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\[[0-9,\s]+\]\s*', '', clean_prompt).strip()

        system_prompt = """You are a prompt rewriter for Google's Veo 3 video generation AI. Your task is to rewrite prompts that were rejected due to policy violations while preserving the creative intent.

CRITICAL RULES:
1. Keep the same visual style, camera movements, and scene description
2. Remove or rephrase any content that could trigger policy violations (violence, explicit content, harmful activities, real people, etc.)
3. The rewritten prompt must be suitable for professional video production
4. Maintain similar length and detail level
5. Do NOT add any explanations - return ONLY the rewritten prompt text
6. Do NOT include prompt numbers or element references - just the descriptive text
7. If the original prompt references specific image numbers, do NOT include those numbers
8. Keep it natural and cinematic

The prompt was rejected with this message: """ + error_message

        user_message = f"""Rewrite this prompt to avoid policy violations while keeping the creative vision:

"{clean_prompt}"

Return ONLY the rewritten prompt text, nothing else."""

        async with aiohttp.ClientSession() as http_session:
            async with http_session.post(
                GROK_API_URL,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {session.grok_api_key}'
                },
                json={
                    'model': GROK_MODEL,
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_message}
                    ],
                    'temperature': 0.7,
                    'max_tokens': 500
                }
            ) as response:
                if response.status != 200:
                    error_data = await response.json()
                    raise Exception(error_data.get('error', {}).get('message', f'API error: {response.status}'))

                data = await response.json()
                fixed_text = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()

                if not fixed_text:
                    return None

                fixed_text = fixed_text.strip('"\'')

                if prompt_prefix:
                    final_prompt = prompt_prefix
                    if elements_str:
                        final_prompt += f' {elements_str}'
                    final_prompt += f': {fixed_text}'
                else:
                    if elements_str:
                        final_prompt = f'{elements_str}: {fixed_text}'
                    else:
                        final_prompt = fixed_text

                return final_prompt

    async def handle_get_status(self, session: ClientSession, data: dict):
        """Retorna status atual da sessão"""
        await self._send_to_websocket(session.websocket, {
            'type': 'STATUS',
            'clientId': session.client_id,
            'profileName': session.profile_name,
            'session': {
                'active': session.active,
                'total_prompts': session.total_prompts,
                'completed': session.completed,
                'errors': session.error_count,
                'current_layer': session.current_layer
            },
            'grok_configured': bool(session.grok_api_key),
            'auto_fix_enabled': session.auto_fix_enabled,
            'errors_count': len(session.errors),
            'fix_queue_size': len(session.fix_queue),
            'fixed_count': len(session.fixed_prompts),
            'activeProfiles': len(self.websocket_to_client)
        })

    async def handle_start_session(self, session: ClientSession, data: dict):
        """Inicia nova sessão de automação"""
        session.active = True
        session.total_prompts = data.get('totalPrompts', 0)
        session.completed = 0
        session.error_count = 0
        session.current_layer = 'LAYER 1 (DOM)'

        # Limpar estado anterior
        session.errors = []
        session.fix_queue = []
        session.fixed_prompts = []

        logger.info(f"[{session.profile_name}] Sessão iniciada: {session.total_prompts} prompts")

        await self._send_to_websocket(session.websocket, {
            'type': 'SESSION_STARTED',
            'clientId': session.client_id,
            'totalPrompts': session.total_prompts
        })

    async def handle_end_session(self, session: ClientSession, data: dict):
        """Finaliza sessão de automação"""
        session.active = False

        report = {
            'type': 'SESSION_ENDED',
            'clientId': session.client_id,
            'profileName': session.profile_name,
            'total_prompts': session.total_prompts,
            'completed': session.completed,
            'errors': session.error_count,
            'errors_by_type': self._count_errors_by_type(session),
            'fix_queue': [{
                'prompt_number': item['prompt_number'],
                'status': item['status'],
                'fixed_prompt': item.get('fixed_prompt')
            } for item in session.fix_queue],
            'fixed_count': len(session.fixed_prompts)
        }

        logger.info(f"[{session.profile_name}] Sessão finalizada: {report['completed']}/{report['total_prompts']}")

        await self._send_to_websocket(session.websocket, report)

    async def handle_layer_update(self, session: ClientSession, data: dict):
        """Atualiza layer atual"""
        layer = data.get('layer', 'MODO DIRETO')
        session.current_layer = layer

        await self._send_to_websocket(session.websocket, {
            'type': 'LAYER_UPDATE',
            'clientId': session.client_id,
            'layer': layer
        })

    async def handle_progress_update(self, session: ClientSession, data: dict):
        """Atualiza progresso da sessão"""
        session.completed = data.get('completed', session.completed)

        logger.debug(f"[{session.profile_name}] Progresso: {session.completed}/{session.total_prompts}")

    def _count_errors_by_type(self, session: ClientSession) -> Dict[str, int]:
        """Conta erros por tipo para uma sessão"""
        counts = {}
        for error in session.errors:
            error_type = error.error_type.value
            counts[error_type] = counts.get(error_type, 0) + 1
        return counts

    # ========== JOB QUEUE HANDLERS ==========

    async def handle_add_job(self, session: ClientSession, data: dict):
        """Adiciona um job à fila"""
        job_id = data.get('jobId', f"job_{datetime.now().timestamp()}")
        job_name = data.get('jobName', f"Job-{len(session.job_queue) + 1:02d}")
        download_folder = data.get('downloadFolder', self._get_folder_name(session.assigned_folder))
        prompts = data.get('prompts', [])

        job = Job(
            id=job_id,
            name=job_name,
            download_folder=download_folder,
            prompts=prompts,
            status='queued'
        )

        session.job_queue.append(job)
        session.job_counter += 1

        logger.info(f"[{session.profile_name}] Job adicionado: {job_name} ({len(prompts)} prompts)")

        await self._send_to_websocket(session.websocket, {
            'type': 'JOB_ADDED',
            'jobId': job_id,
            'jobName': job_name,
            'queueLength': len(session.job_queue)
        })

    async def handle_start_job(self, session: ClientSession, data: dict):
        """Inicia um job da fila"""
        job_id = data.get('jobId')

        job = None
        for j in session.job_queue:
            if j.id == job_id:
                job = j
                break

        if not job:
            # Pegar próximo job da fila
            for j in session.job_queue:
                if j.status == 'queued':
                    job = j
                    break

        if not job:
            await self._send_to_websocket(session.websocket, {
                'type': 'ERROR',
                'message': 'Nenhum job disponível na fila'
            })
            return

        job.status = 'running'
        job.started_at = datetime.now()
        session.current_job_id = job.id
        session.active = True
        session.total_prompts = len(job.prompts)
        session.completed = 0

        logger.info(f"[{session.profile_name}] Job iniciado: {job.name}")

        await self._send_to_websocket(session.websocket, {
            'type': 'JOB_STARTED',
            'jobId': job.id,
            'jobName': job.name,
            'totalPrompts': len(job.prompts),
            'downloadFolder': job.download_folder
        })

    async def handle_complete_job(self, session: ClientSession, data: dict):
        """Marca um job como completo"""
        job_id = data.get('jobId') or session.current_job_id
        success = data.get('success', True)

        job = None
        for j in session.job_queue:
            if j.id == job_id:
                job = j
                break

        if job:
            job.status = 'completed' if success else 'error'
            job.completed_at = datetime.now()
            job.completed_count = data.get('completedCount', 0)
            job.error_count = data.get('errorCount', 0)

            logger.info(f"[{session.profile_name}] Job {job.status}: {job.name} ({job.completed_count}/{len(job.prompts)})")

        session.current_job_id = None
        session.active = False

        # Verificar se há mais jobs na fila
        next_job = None
        for j in session.job_queue:
            if j.status == 'queued':
                next_job = j
                break

        await self._send_to_websocket(session.websocket, {
            'type': 'JOB_COMPLETED',
            'jobId': job_id,
            'success': success,
            'hasMoreJobs': next_job is not None,
            'nextJobId': next_job.id if next_job else None
        })

    async def handle_get_job_queue(self, session: ClientSession, data: dict):
        """Retorna a fila de jobs"""
        jobs = []
        for job in session.job_queue:
            jobs.append({
                'id': job.id,
                'name': job.name,
                'status': job.status,
                'promptCount': len(job.prompts),
                'completedCount': job.completed_count,
                'errorCount': job.error_count,
                'downloadFolder': job.download_folder
            })

        await self._send_to_websocket(session.websocket, {
            'type': 'JOB_QUEUE',
            'jobs': jobs,
            'currentJobId': session.current_job_id
        })

    async def handle_remove_job(self, session: ClientSession, data: dict):
        """Remove um job da fila"""
        job_id = data.get('jobId')

        for i, job in enumerate(session.job_queue):
            if job.id == job_id and job.status == 'queued':
                session.job_queue.pop(i)
                logger.info(f"[{session.profile_name}] Job removido: {job.name}")

                await self._send_to_websocket(session.websocket, {
                    'type': 'JOB_REMOVED',
                    'jobId': job_id,
                    'queueLength': len(session.job_queue)
                })
                return

        await self._send_to_websocket(session.websocket, {
            'type': 'ERROR',
            'message': 'Job não encontrado ou não pode ser removido'
        })

    async def handler(self, websocket: WebSocketServerProtocol):
        """Handler principal de conexões WebSocket"""
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        finally:
            await self.unregister(websocket)


async def main():
    """Função principal"""
    server = FFLabServer()

    print(f"""
===============================================================
                    F&F LAB SERVER
===============================================================

   Python WebSocket Server v3.0 - Multi-Profile
   Suporte para ate {MAX_PROFILES} perfis Chrome simultaneos
   Servidor rodando em ws://{HOST}:{PORT}

   Pressione Ctrl+C para parar

===============================================================
""")

    async with websockets.serve(server.handler, HOST, PORT):
        logger.info(f"Servidor iniciado em ws://{HOST}:{PORT}")
        await asyncio.Future()  # Run forever


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[F&F Lab] Servidor encerrado pelo usuário")
    except Exception as e:
        print(f"\n[F&F Lab] Erro: {e}")
        sys.exit(1)
