window.OIKOS_KEYS = {
  LOGIN: ["oikos"],

  CODE_01: [
    "codigo01",
    "laços",
    "lacos",
    "ligacao",
    "ligação",
    "familia",
    "família",
    "alice+gabriel"
  ],

  CODE_02: [
    "codigo02",
    "arquivo",
    "memoria",
    "memória",
    "passado",
    "verena",
    "ice|verena"
  ],

  CODE_03: [
    "codigo03",
    "aura",
    "Aura",
    "nao-voltei",
    "não-voltei",
    "presenca",
    "presença",
    "duda",
    "ausencia-prolongada"
  ],

  // ✅ CANAL NÃO AUTORIZADO (c04)
  CODE_04: [
    "aviso",
    "canal-nao-autorizado",
    "transmissao",
    "transmissão",
    "anonima",
    "duda",
    "oikos-pt"
  ],

  ADMIN: ["oikos-admin-913"],

  // Sub-códigos do ARQUIVO (por pasta)
  ARCHIVE_FOLDERS: {
    Ice: ["ice", "gelo", "ice-verena", "verena|ice"],
    Verena: ["verena", "passado-verena", "arquivo-verena"],
    Gabriel: ["gabriel", "g", "gabriel-1", "alice+gabriel"],
    Alice: ["alice", "a", "alice-1", "ligação"],
    Henrique: ["henrique", "h", "henrique-1"]
  },

  // ✅ LISTA DE FICHEIROS (isto é o que faz aparecer os PNG na UI)
  // Mete aqui exatamente os nomes reais dos ficheiros (com maiúsculas iguais).
  ARCHIVE_INDEX: {
    Ice: [
      "ice.png",
      "ice2.png",
      "ice3.png",
      "ice4.png",
      "ice5.png",
    ],
    Verena: [
      "verena.png",
      "verena2.png",
      "verena3.png",
      "verena4.png",
      "verena5.png"
    ],
    Gabriel: [
      "gabriel.png"
    ],
    Alice: [
      "alice.png"
    ],
    Henrique: [
      "Jornal.png",
      "testamento_particular.png",
      "registo_particular.png",
      "nota_pessoal.png",
      "declaração_de_obito.png",
      "carta_para_duda.png"
    ]
  }

  // (Opcional) Se quiseres códigos por ficheiro:
  // ARCHIVE_FILES: {
  //   "Ice/segredo.png": ["x1", "x2"]
  // }
};
