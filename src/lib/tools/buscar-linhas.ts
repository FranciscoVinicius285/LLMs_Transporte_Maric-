import { tool } from 'ai';
import { z } from 'zod';

import { pool } from '$lib/db/postgres';

export const buscarLinhas = tool({
    description: `
        Busca linhas de ônibus de Maricá entre uma origem e um destino.

        Use esta ferramenta sempre que o usuário perguntar:
        - quais ônibus fazem determinado trajeto;
        - quais linhas vão de um local para outro;
        - quais linhas saem de determinado local;
        - quais linhas chegam a determinado local.

        A ferramenta aceita diferentes formas de escrever um local,
        como "Centro", "Centro de Maricá", "Rodoviária" e
        "Terminal de Maricá".
    `,

    inputSchema: z.object({
        origem: z
            .string()
            .describe(`
                Local de origem informado pelo usuário.

                Exemplos:
                - Centro
                - Centro de Maricá
                - Maricá
                - Rodoviária
                - Terminal de Maricá
                - Inoã
                - Passarela de Inoã
                - Recanto
                - Recanto Itaipuaçu
                - Terminal de Itaipuaçu
                - Ponta Negra
                - Bambuí
                - Rua 128
            `),

        destino: z
            .string()
            .describe(`
                Local de destino informado pelo usuário.

                Exemplos:
                - Centro
                - Centro de Maricá
                - Maricá
                - Rodoviária
                - Terminal de Maricá
                - Inoã
                - Passarela de Inoã
                - Recanto
                - Recanto Itaipuaçu
                - Terminal de Itaipuaçu
                - Ponta Negra
                - Bambuí
                - Rua 128
            `)
    }),

    execute: async ({ origem, destino }) => {

    console.log('==============================');
    console.log('TOOL: buscarLinhas');
    console.log('Origem recebida:', origem);
    console.log('Destino recebido:', destino);

    const query = `
    WITH origem_local AS (
        SELECT l.id, l.nome
        FROM locais l
        JOIN aliases_locais a
            ON a.local_id = l.id
        WHERE a.alias_normalizado = normalizar_local_db($1)
        LIMIT 1
    ),

    destino_local AS (
        SELECT l.id, l.nome
        FROM locais l
        JOIN aliases_locais a
            ON a.local_id = l.id
        WHERE a.alias_normalizado = normalizar_local_db($2)
        LIMIT 1
    )

    SELECT
        l.codigo,
        l.nome AS linha_nome,
        s.origem,
        s.destino

    FROM sentidos s

    JOIN linhas l
        ON l.id = s.linha_id

    JOIN origem_local o
        ON s.origem = o.nome

    JOIN destino_local d
        ON s.destino = d.nome

    ORDER BY l.codigo;
`;

    const result = await pool.query(query, [
        origem,
        destino
    ]);

    console.log('Linhas encontradas:', result.rows);
    console.log('==============================');

   return {
    encontrado: result.rows.length > 0,

    origem,
    destino,

    linhas: result.rows.map((linha) => ({
        codigo: linha.codigo,
        nome: linha.linha_nome,
        origem: linha.origem,
        destino: linha.destino
    }))
};
}
});