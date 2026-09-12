import { tool } from 'ai';
import { z } from 'zod';

import { pool } from '$lib/db/postgres';

export const buscarLinhasPorReferencia = tool({
    description: `
        Busca linhas de ônibus de Maricá que passam por um
        ponto de referência.

        A ferramenta pode trabalhar de duas formas:

        1. Somente ponto de referência:
           encontra todas as linhas que passam pelo local.

        2. Ponto de referência + destino:
           encontra somente as linhas que passam pelo ponto
           de referência e possuem um sentido que atende
           o destino informado.

        Exemplos:

        - "Qual ônibus passa pelo Barroco?"
        - "Qual linha passa pelo Fórum de Maricá?"
        - "Qual ônibus passa pelo Barroco e vai para Maricá?"
        - "Qual linha passa pela Rua 34 e vai para o Centro?"
        - "Tem ônibus no Hospital Conde Modesto Leal que vai para Itaipuaçu?"
    `,

    inputSchema: z.object({
        referencia: z
            .string()
            .describe(`
                Ponto de referência mencionado pelo usuário.

                Exemplos:
                - Praça do Barroco
                - Barroco
                - Praça do Ferreirinha
                - Ferreirinha
                - Rua 34
                - Avenida Carlos Marighella
                - Estrada dos Cajueiros
                - MCMV Inoã
                - Ponto do 53
                - Hospital Municipal Conde Modesto Leal
                - Fórum de Maricá
                - Parque Nanci
                - Cemitério de Maricá
                - Hospital Municipal Dr. Ernesto Che Guevara
                - Detran
                - Passarela de São José
                - Itaocaia Valley
                - Itaocaia
            `),

        destino: z
            .string()
            .optional()
            .describe(`
                Destino desejado pelo usuário, quando informado.

                Exemplos:
                - Centro
                - Centro de Maricá
                - Maricá
                - Recanto
                - Recanto Itaipuaçu
                - Itaipuaçu
                - Inoã
                - Ponta Negra
                - Bambuí
                - Rua 128
                - Terminal de Itaipuaçu

                Pode ficar vazio quando o usuário quiser
                somente saber quais linhas passam pelo
                ponto de referência.
            `)
    }),

    execute: async ({ referencia, destino }) => {

        console.log('==============================');
        console.log('TOOL: buscarLinhasPorReferencia');
        console.log('Referência recebida:', referencia);
        console.log('Destino recebido:', destino ?? '(não informado)');

        /*
         * ----------------------------------------------------
         * CASO 1:
         * SOMENTE REFERÊNCIA
         * ----------------------------------------------------
         *
         * Exemplo:
         * "Qual ônibus passa pelo Barroco?"
         *
         * Retorna todas as linhas relacionadas ao ponto.
         */

        if (!destino?.trim()) {

            const query = `
                SELECT DISTINCT
                    l.codigo,
                    l.nome AS linha_nome,
                    p.nome AS ponto_referencia
                FROM aliases_pontos_referencia apr

                JOIN pontos_referencia p
                    ON p.id = apr.ponto_referencia_id

                JOIN linha_pontos_referencia lpr
                    ON lpr.ponto_referencia_id = p.id

                JOIN linhas l
                    ON l.id = lpr.linha_id

                WHERE
                    apr.alias_normalizado =
                    normalizar_local_db($1)

                ORDER BY l.codigo;
            `;

            const result = await pool.query(query, [
                referencia
            ]);

            console.log(
                'Modo: referência somente'
            );

            console.log(
                'Linhas encontradas:',
                result.rows
            );

            console.log('==============================');

            return {
                encontrado: result.rows.length > 0,

                referencia,

                destino: null,

                pontoReferencia:
                    result.rows[0]?.ponto_referencia ?? null,

                linhas: result.rows.map((linha) => ({
                    codigo: linha.codigo,
                    nome: linha.linha_nome
                }))
            };
        }

        /*
         * ----------------------------------------------------
         * CASO 2:
         * REFERÊNCIA + DESTINO
         * ----------------------------------------------------
         *
         * Exemplo:
         * "Qual linha passa pelo Barroco e vai para Maricá?"
         *
         * Primeiro encontramos o ponto de referência.
         * Depois verificamos quais sentidos dessas linhas
         * possuem o destino informado.
         */

        const query = `
            WITH referencia_local AS (

                SELECT DISTINCT
                    p.id,
                    p.nome

                FROM aliases_pontos_referencia apr

                JOIN pontos_referencia p
                    ON p.id = apr.ponto_referencia_id

                WHERE
                    apr.alias_normalizado =
                    normalizar_local_db($1)

                LIMIT 1
            ),

            destino_local AS (

                SELECT DISTINCT
                    l.id,
                    l.nome

                FROM aliases_locais al

                JOIN locais l
                    ON l.id = al.local_id

                WHERE
                    al.alias_normalizado =
                    normalizar_local_db($2)

                LIMIT 1
            )

            SELECT DISTINCT

                l.codigo,
                l.nome AS linha_nome,

                p.nome AS ponto_referencia,

                s.nome AS sentido,
                s.origem,
                s.destino

            FROM referencia_local rp

            JOIN linha_pontos_referencia lpr
                ON lpr.ponto_referencia_id = rp.id

            JOIN linhas l
                ON l.id = lpr.linha_id

            JOIN sentidos s
                ON s.linha_id = l.id

            JOIN destino_local dl
                ON s.destino = dl.nome

            JOIN pontos_referencia p
                ON p.id = rp.id

            ORDER BY l.codigo;
        `;

        const result = await pool.query(query, [
            referencia,
            destino
        ]);

        console.log(
            'Modo: referência + destino'
        );

        console.log(
            'Linhas encontradas:',
            result.rows
        );

        console.log('==============================');

        return {
    encontrado: result.rows.length > 0,

    referenciaInformada: referencia,
    destinoInformado: destino,

    pontoReferencia:
        result.rows[0]?.ponto_referencia ?? null,

    linhas: result.rows.map((linha) => ({
        codigo: linha.codigo,
        nomeCompleto: linha.linha_nome,
        origem: linha.origem,
        destino: linha.destino
            }))
        };
    }
});