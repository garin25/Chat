
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    estado VARCHAR(100) DEFAULT 'Available'
);

CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    tipo VARCHAR(10) DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE mensajes (
    id SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES usuarios(id)
);


CREATE TABLE participantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(usuario_id, chat_id)
);




CREATE TABLE contactos (
    titular_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    contacto_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (titular_id, contacto_id),
    CHECK (titular_id != contacto_id)
);

ALTER TABLE contactos ADD COLUMN alias VARCHAR(50);


ALTER TABLE chats ADD COLUMN ultimo_mensaje_contenido TEXT;
ALTER TABLE chats ADD COLUMN ultimo_mensaje_fecha TIMESTAMPTZ;