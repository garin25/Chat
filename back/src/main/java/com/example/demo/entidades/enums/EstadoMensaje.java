package com.example.demo.entidades.enums;

public enum EstadoMensaje {
    ENVIANDO,   // (Solo Frontend) El relojito
    ENVIADO,    // (1 Check) Llegó al servidor
    ENTREGADO,  // (2 Checks grises) Le llegó al otro usuario (websocket)
    LEIDO       // (2 Checks azules) El otro abrió el chat
}
