import { tool } from 'ai';
import { z } from 'zod';

import { pool } from '$lib/db/postgres';

export const buscarItinerario = tool({
    description: `
        Busca o itinerário de uma linha de ônibus de Maricá.

        Pode localizar o sentido utilizando:
        - IDA;
        - VOLTA;
        - CIRCULAR;
        - nome da origem;
        - nome do destino;
        - origem e destino.

        Exemplos:
        - "Qual é o itinerário do E30?"
        - "Me passe o itinerário do E30A com sentido Recanto."
        - "Qual é o itinerário do E30 do Centro para Recanto?"
        - "Por onde passa o E30A no sentido Centro?"
        - "Qual é o itinerário do E30E de Itaipuaçu para o Centro?"
    `,

    inputSchema: z.object({
        linha: z
            .string()
            .describe(`
                Código da linha.

                Exemplos:
                E30
                E30A
                E30B
                E21
                E37
            `),

        sentido: z
            .string()
            .optional()
            .describe(`
                Sentido informado pelo usuário.

                Pode ser:
                - IDA
                - VOLTA
                - CIRCULAR
                - Centro
                - Recanto
                - Itaipuaçu
                - Inoã
                - outro local usado como origem ou destino.
            `),

        origem: z
            .string()
            .optional()
            .describe(`
                Origem do trajeto, quando informada pelo usuário.
            `),

        destino: z
            .string()
            .optional()
            .describe(`
                Destino do trajeto, quando informado pelo usuário.
            `)
    }),

    execute: async ({
        linha,
        sentido,
        origem,
        destino
    }) => {

        console.log('==============================');
        console.log('TOOL: buscarItinerario');
        console.log('Linha:', linha);
        console.log('Sentido:', sentido);
        console.log('Origem:', origem);
        console.log('Destino:', destino);

        /*
         * ----------------------------------------------------
         * 1. ENCONTRAR A LINHA
         * ----------------------------------------------------
         */

        const linhaResult = await pool.query(
            `
            SELECT
                id,
                codigo,
                nome
            FROM linhas
            WHERE UPPER(codigo) = UPPER($1)
            LIMIT 1;
            `,
            [linha.trim()]
        );

        if (linhaResult.rows.length === 0) {

            console.log('Linha não encontrada.');

            return {
                encontrado: false,
                mensagem: 'Linha não encontrada.',
                linha: linha,
                sentidos: []
            };
        }

        const linhaEncontrada = linhaResult.rows[0];


        /*
         * ----------------------------------------------------
         * 2. BUSCAR SENTIDOS E ITINERÁRIO
         * ----------------------------------------------------
         *
         * A consulta permite encontrar o sentido por:
         *
         * - nome do sentido:
         *   IDA / VOLTA / CIRCULAR
         *
         * - origem:
         *   CENTRO / RECANTO / INOÃ ...
         *
         * - destino:
         *   CENTRO / RECANTO / ITAIPUAÇU ...
         *
         * - origem + destino.
         */

        const query = `
            SELECT
                s.id AS sentido_id,
                s.nome AS sentido,
                s.origem,
                s.destino,

                iv.ordem,
                v.nome AS via

            FROM sentidos s

            JOIN itinerario_vias iv
                ON iv.sentido_id = s.id

            JOIN vias v
                ON v.id = iv.via_id

            WHERE
                s.linha_id = $1

                AND (
                    $2::TEXT IS NULL

                    OR UPPER(s.nome) = UPPER($2)

                    OR (
                        s.origem IS NOT NULL
                        AND normalizar_local_db(s.origem)
                            = normalizar_local_db($2)
                    )

                    OR (
                        s.destino IS NOT NULL
                        AND normalizar_local_db(s.destino)
                            = normalizar_local_db($2)
                    )
                )

                AND (
                    $3::TEXT IS NULL
                    OR (
                        s.origem IS NOT NULL
                        AND normalizar_local_db(s.origem)
                            = normalizar_local_db($3)
                    )
                )

                AND (
                    $4::TEXT IS NULL
                    OR (
                        s.destino IS NOT NULL
                        AND normalizar_local_db(s.destino)
                            = normalizar_local_db($4)
                    )
                )

            ORDER BY
                s.id,
                iv.ordem;
        `;

        const result = await pool.query(query, [
            linhaEncontrada.id,
            sentido?.trim() || null,
            origem?.trim() || null,
            destino?.trim() || null
        ]);


        /*
         * ----------------------------------------------------
         * 3. NENHUM RESULTADO
         * ----------------------------------------------------
         */

        if (result.rows.length === 0) {

            console.log(
                'Nenhum itinerário encontrado para o filtro informado.'
            );

            console.log('==============================');

            return {
                encontrado: false,

                linha: {
                    codigo: linhaEncontrada.codigo,
                    nome: linhaEncontrada.nome
                },

                sentidoInformado: sentido ?? null,

                origemInformada: origem ?? null,

                destinoInformado: destino ?? null,

                sentidos: []
            };
        }


        /*
         * ----------------------------------------------------
         * 4. AGRUPAR POR SENTIDO
         * ----------------------------------------------------
         */

        const sentidosMap = new Map<
            number,
            {
                nome: string;
                origem: string | null;
                destino: string | null;
                vias: string[];
            }
        >();

        for (const item of result.rows) {

            if (!sentidosMap.has(item.sentido_id)) {

                sentidosMap.set(item.sentido_id, {
                    nome: item.sentido,
                    origem: item.origem,
                    destino: item.destino,
                    vias: []
                });
            }

            sentidosMap
                .get(item.sentido_id)!
                .vias
                .push(item.via);
        }


        /*
         * ----------------------------------------------------
         * 5. RETORNO
         * ----------------------------------------------------
         */

        const sentidos = Array.from(
            sentidosMap.values()
        ).map((item) => ({
            sentido: item.nome,
            origem: item.origem,
            destino: item.destino,
            vias: item.vias
        }));

        console.log(
            'Sentidos encontrados:',
            sentidos.length
        );

        console.log('==============================');

        return {
            encontrado: true,

            linha: {
                codigo: linhaEncontrada.codigo,
                nome: linhaEncontrada.nome
            },

            sentidos
        };
    }
});