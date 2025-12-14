import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all active currencies
 * GET /api/currencies
 */
export async function getCurrencies(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const currencies = await prisma.currency.findMany({
            where: { is_active: true },
            orderBy: { code: 'asc' },
        });

        res.json({
            success: true,
            data: { currencies },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get currency by ID or code
 * GET /api/currencies/:idOrCode
 */
export async function getCurrency(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { idOrCode } = req.params;

        const currency = await prisma.currency.findFirst({
            where: {
                OR: [
                    { id: idOrCode },
                    { code: idOrCode.toUpperCase() },
                ],
            },
        });

        if (!currency) {
            return res.status(404).json({
                success: false,
                error: 'Moneda no encontrada',
            });
        }

        res.json({
            success: true,
            data: { currency },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Convert between currencies
 * GET /api/currencies/convert?from=USD&to=CLP&amount=100
 */
export async function convertCurrency(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { from, to, amount } = req.query;

        if (!from || !to || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren parámetros: from, to, amount',
            });
        }

        const [fromCurrency, toCurrency] = await Promise.all([
            prisma.currency.findUnique({ where: { code: String(from).toUpperCase() } }),
            prisma.currency.findUnique({ where: { code: String(to).toUpperCase() } }),
        ]);

        if (!fromCurrency || !toCurrency) {
            return res.status(404).json({
                success: false,
                error: 'Moneda no encontrada',
            });
        }

        const amountNum = parseFloat(String(amount));

        // Convert to USD first, then to target currency
        const fromRate = fromCurrency.exchange_rate_to_usd || 1;
        const toRate = toCurrency.exchange_rate_to_usd || 1;

        const amountInUSD = amountNum / fromRate;
        const convertedAmount = amountInUSD * toRate;

        res.json({
            success: true,
            data: {
                from: from,
                to: to,
                originalAmount: amountNum,
                convertedAmount: Math.round(convertedAmount * 100) / 100,
                rate: toRate / fromRate,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
}
