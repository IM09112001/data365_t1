const sessions = new Map();

export const getSession  = (id)       => sessions.get(id) || null;
export const setSession  = (id, data) => sessions.set(id, data);
export const clearSession = (id)      => sessions.delete(id);
