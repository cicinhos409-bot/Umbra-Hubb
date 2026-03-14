FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg curl unzip && rm -rf /var/lib/apt/lists/*

# Instala Deno
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

# Baixa o componente remoto do yt-dlp para resolver desafios do YouTube
RUN pip install yt-dlp flask flask-cors requests && \
    yt-dlp --update-to nightly && \
    yt-dlp --remote-components ejs:github || true

WORKDIR /app
COPY . .

EXPOSE 3000
CMD ["python", "server.py"]
