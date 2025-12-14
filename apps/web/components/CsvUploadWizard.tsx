'use client';

import { useState } from 'react';

interface CsvUploadWizardProps {
    projectId: string;
    onComplete: (result: any) => void;
    onClose: () => void;
}

export default function CsvUploadWizard({ projectId, onComplete, onClose }: CsvUploadWizardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [updateExisting, setUpdateExisting] = useState(true);
    const [dryRun, setDryRun] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('project_id', projectId);
            formData.append('update_existing', updateExisting.toString());
            formData.append('dry_run', dryRun.toString());

            const response = await fetch('http://localhost:3000/api/units/import/csv', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: formData,
            });

            const data = await response.json();
            setResult(data);

            if (data.success && !dryRun) {
                onComplete(data);
            }
        } catch (error) {
            console.error('Error uploading CSV:', error);
            setResult({
                success: false,
                error: 'Error al cargar el archivo',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Importar Unidades desde CSV</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">📋 Formato del archivo CSV</h3>
                        <p className="text-sm text-blue-800 mb-2">El archivo debe contener las siguientes columnas:</p>
                        <code className="block text-xs bg-blue-100 p-2 rounded">
                            SKU,Nombre,Tipo,Estado,Precio,Moneda,Habitaciones,Baños,Área M²,Piso
                        </code>
                        <p className="text-xs text-blue-700 mt-2">
                            <strong>Tipos válidos:</strong> DEPARTAMENTO, CASA, COMERCIAL, TERRENO, OFICINA, ESTACIONAMIENTO, BODEGA
                            <br />
                            <strong>Estados válidos:</strong> DISPONIBLE, RESERVADO, VENDIDO, NO DISPONIBLE
                            <br />
                            <strong>Monedas válidas:</strong> USD, CLP, UF
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seleccionar archivo CSV
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-gray-600">
                                📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    {/* Options */}
                    <div className="space-y-4 mb-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={updateExisting}
                                onChange={(e) => setUpdateExisting(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700">
                                Actualizar unidades existentes (por SKU)
                            </span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={dryRun}
                                onChange={(e) => setDryRun(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700">
                                Vista previa (no aplicar cambios)
                            </span>
                        </label>
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`rounded-lg p-4 mb-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                {result.success ? '✅ Resultado' : '❌ Error'}
                            </h3>
                            {result.success ? (
                                <div className="text-sm text-green-800">
                                    <p><strong>Total de filas:</strong> {result.data.total_rows}</p>
                                    <p><strong>Creadas:</strong> {result.data.created}</p>
                                    <p><strong>Actualizadas:</strong> {result.data.updated}</p>
                                    <p><strong>Errores:</strong> {result.data.errors}</p>
                                    {result.data.dry_run && (
                                        <p className="mt-2 text-yellow-700">
                                            ⚠️ Vista previa - No se aplicaron cambios
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-red-800">{result.error}</p>
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-red-900 mb-1">Errores encontrados:</p>
                                    <div className="max-h-40 overflow-y-auto text-xs text-red-800 bg-red-100 p-2 rounded">
                                        {result.errors.map((err: any, i: number) => (
                                            <div key={i}>Fila {err.row}: {err.error}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {uploading ? 'Procesando...' : dryRun ? 'Vista Previa' : 'Importar'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
