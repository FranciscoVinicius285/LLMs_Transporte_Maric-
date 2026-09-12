import { tool } from 'ai';
import { z } from 'zod';

import { pool } from '$lib/db/postgres';

export const buscarHorarios = tool({
    description: `
        Busca os horários de saída das linhas de ônibus de Maricá.

        Pode consultar:
        - dias úteis;
        - sábado;
        - domingo;
        - feriado.

        Pode buscar:
        - todos os horários de uma linha;
        - horários de um sentido;
        - horários de uma origem e destino;
        - horários de determinado tipo de dia.

        Exemplos:
        - "Quais são os horários do E30?"
        - "Horários do E30 para Recanto."
        - "Quais os horários do E30 no sábado?"
        - "Horários do E30 do Recanto para o Centro no domingo."
    `,

    inputSchema: z.object({
        linha: z
            .string()
            .describe(`
                Código da linha.

                Exemplos:
                E30
                E30A
                E21
                E30B
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
                - Inoã
                - Itaipuaçu
                - outro local relacionado ao sentido.
            `),

        origem: z
            .string()
            .optional()
            .describe(`
                Origem do trajeto, quando informada.
            `),

        destino: z
            .string()
            .optional()
            .describe(`
                Destino do trajeto, quando informado.
            `),

        tipoDia: z
            .string()
            .optional()
            .describe(`
                Tipo de dia solicitado.

                Valores possíveis:
                - DIA_UTIL
                - SABADO
                - DOMINGO
                - FERIADO

                Também pode receber:
                - dia útil
                - sábado
                - domingo
                - feriado
            `)
    }),

    execute: async ({
        linha,
        sentido,
        origem,
        destino,
        tipoDia
    }) => {

        console.log('==============================');
        console.log('TOOL: buscarHorarios');
        console.log('Linha:', linha);
        console.log('Sentido:', sentido);
        console.log('Origem:', origem);
        console.log('Destino:', destino);
        console.log('Tipo de dia:', tipoDia);

        /*
         * ----------------------------------------------------
         * 1. NORMALIZAR TIPO DE DIA
         * ----------------------------------------------------
         */

        let tipoDiaNormalizado: string | null = null;

        if (tipoDia) {

            const valor = tipoDia
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toUpperCase();

            const tipos: Record<string, string> = {

                'DIA UTIL': 'DIA_UTIL',
                'DIAUTIL': 'DIA_UTIL',
                'DIA_UTEIS': 'DIA_UTIL',
                'DIAS UTEIS': 'DIA_UTIL',
                'DIASUTEIS': 'DIA_UTIL',

                'SABADO': 'SABADO',

                'DOMINGO': 'DOMINGO',

                'FERIADO': 'FERIADO'
            };

            tipoDiaNormalizado =
                tipos[valor] ?? valor;
        }


        /*
         * ----------------------------------------------------
         * 2. ENCONTRAR LINHA
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
                linha
            };
        }

        const linhaEncontrada = linhaResult.rows[0];


        /*
         * ----------------------------------------------------
         * 3. BUSCAR HORÁRIOS
         * ----------------------------------------------------
         */

        const query = `
            SELECT
                h.horario,

                h.tipo_dia,

                s.nome AS sentido,

                s.origem,

                s.destino

            FROM horarios h

            LEFT JOIN sentidos s
                ON s.id = h.sentido_id

            WHERE
                h.linha_id = $1

                AND (
                    $2::TEXT IS NULL
                    OR h.tipo_dia = $2
                )

                AND (
                    $3::TEXT IS NULL

                    OR UPPER(s.nome) = UPPER($3)

                    OR (
                        s.origem IS NOT NULL
                        AND normalizar_local_db(s.origem)
                            = normalizar_local_db($3)
                    )

                    OR (
                        s.destino IS NOT NULL
                        AND normalizar_local_db(s.destino)
                            = normalizar_local_db($3)
                    )
                )

                AND (
                    $4::TEXT IS NULL
                    OR (
                        s.origem IS NOT NULL
                        AND normalizar_local_db(s.origem)
                            = normalizar_local_db($4)
                    )
                )

                AND (
                    $5::TEXT IS NULL
                    OR (
                        s.destino IS NOT NULL
                        AND normalizar_local_db(s.destino)
                            = normalizar_local_db($5)
                    )
                )

            ORDER BY
                h.tipo_dia,
                s.id NULLS LAST,
                h.horario;
        `;

        const result = await pool.query(query, [
            linhaEncontrada.id,
            tipoDiaNormalizado,
            sentido?.trim() || null,
            origem?.trim() || null,
            destino?.trim() || null
        ]);


        /*
         * ----------------------------------------------------
         * 4. NENHUM HORÁRIO
         * ----------------------------------------------------
         */

        if (result.rows.length === 0) {

            console.log(
                'Nenhum horário encontrado.'
            );

            console.log('==============================');

            return {
                encontrado: false,

                linha: {
                    codigo: linhaEncontrada.codigo,
                    nome: linhaEncontrada.nome
                },

                horarios: []
            };
        }


        /*
         * ----------------------------------------------------
         * 5. AGRUPAR HORÁRIOS
         * ----------------------------------------------------
         */

        const grupos = new Map<
            string,
            {
                tipoDia: string;
                sentido: string | null;
                origem: string | null;
                destino: string | null;
                horarios: string[];
            }
        >();

        for (const item of result.rows) {

            const chave = [
                item.tipo_dia,
                item.sentido ?? ''
            ].join('|');

            if (!grupos.has(chave)) {

                grupos.set(chave, {
                    tipoDia: item.tipo_dia,
                    sentido: item.sentido,
                    origem: item.origem,
                    destino: item.destino,
                    horarios: []
                });
            }

            grupos
                .get(chave)!
                .horarios
                .push(
                    item.horario
                );
        }


        /*
         * ----------------------------------------------------
         * 6. RETORNO
         * ----------------------------------------------------
         */

        return {
            encontrado: true,

            linha: {
                codigo: linhaEncontrada.codigo,
                nome: linhaEncontrada.nome
            },

            horarios: Array.from(
                grupos.values()
            )
        };
    }
});