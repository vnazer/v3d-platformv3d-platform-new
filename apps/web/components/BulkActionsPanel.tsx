'use client';

import { useState } from 'react';

interface BulkActionsPanelProps {
    selectedCount: number;
    selectedIds: string[];
    onUpdateStatus: (status: string) => void;
    onUpdatePrices: (adjustment: any) => void;
    onDelete: () => void;
    onClearSelection: () => void;
}

export default function BulkActionsPanel({
    selectedCount,
    selectedIds,
    onUpdateStatus,
    onUpdatePrices,
    onDelete,
    onClearSelection,
}: BulkActionsPanelProps) {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showPriceMenu, setShowPriceMenu] = useState(false);
    const [priceAdjustment, setPriceAdjustment] = useState({ type: 'percentage', value: 0, apply_to: 'price' });

    if (selectedCount === 0) return null;

    const handleStatusChange = (status: string) => {
        onUpdateStatus(status);
        setShowStatusMenu(false);
    };

    const handlePriceUpdate = () => {
        onUpdatePrices(priceAdjustment);
        setShowPriceMenu(false);
        setPriceAdjustment({ type: 'percentage', value: 0, apply_to: 'price' });
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-white rounded flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-bold">{selectedCount}</span>
                            </div>
                            <span className="font-medium">
                                {selectedCount} unidad{selectedCount !== 1 ? 'es' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Status Update */}
                        <div className="relative">
                            <button
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                            >
                                Cambiar Estado
                            </button>
                            {showStatusMenu && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg py-2 min-w-48">
                                    <button
                                        onClick={() => handleStatusChange('AVAILABLE')}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-900"
                                    >
                                        🟢 Disponible
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('RESERVED')}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-900"
                                    >
                                        🟡 Reservado
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('SOLD')}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-900"
                                    >
                                        🔴 Vendido
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('UNAVAILABLE')}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-900"
                                    >
                                        ⚫ No Disponible
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Price Update */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPriceMenu(!showPriceMenu)}
                                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                            >
                                Actualizar Precios
                            </button>
                            {showPriceMenu && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg p-4 min-w-80">
                                    <h3 className="text-gray-900 font-semibold mb-3">Ajuste de Precios</h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                                            <select
                                                value={priceAdjustment.type}
                                                onChange={(e) => setPriceAdjustment({ ...priceAdjustment, type: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                                            >
                                                <option value="percentage">Porcentaje (%)</option>
                                                <option value="fixed">Valor Fijo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">
                                                Valor {priceAdjustment.type === 'percentage' ? '(%)' : '($)'}
                                            </label>
                                            <input
                                                type="number"
                                                value={priceAdjustment.value}
                                                onChange={(e) => setPriceAdjustment({ ...priceAdjustment, value: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                                                placeholder="Ej: -10 para descuento 10%"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">Aplicar a</label>
                                            <select
                                                value={priceAdjustment.apply_to}
                                                onChange={(e) => setPriceAdjustment({ ...priceAdjustment, apply_to: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                                            >
                                                <option value="price">Precio Principal</option>
                                                <option value="list_price">Precio de Lista</option>
                                                <option value="sale_price">Precio de Venta</option>
                                                <option value="all">Todos los Precios</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={handlePriceUpdate}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Aplicar Ajuste
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delete */}
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                        >
                            Eliminar
                        </button>
                    </div>

                    <button
                        onClick={onClearSelection}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
