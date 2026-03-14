
export const getGlobalDeviceId = () => {
    let id = localStorage.getItem('umbra_global_device_id');
    if (!id) {
        id = 'hub-' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('umbra_global_device_id', id);
    }
    return id;
};

// Este script pode ser injetado ou lido por extensões se elas tiverem permissão de host para o domínio do painel.
if (typeof window !== 'undefined') {
    (window as any).UMBRA_DEVICE_ID = getGlobalDeviceId();
}
