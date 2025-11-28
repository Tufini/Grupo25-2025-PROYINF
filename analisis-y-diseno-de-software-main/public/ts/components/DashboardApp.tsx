import React, { useEffect, useState } from 'react';
import { DashboardLayout } from './DashboardLayout.js';
import { useAuth } from '../store/authStore.js';
import { SimulationHistory } from './SimulationHistory.js';

export const DashboardApp = () => {
    const { user, isLoading, checkAuth } = useAuth();
    const [currentView, setCurrentView] = useState('inicio');

    console.log('DashboardApp render - user:', user, 'isLoading:', isLoading);

    // Verificar autenticación al cargar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        checkAuth();
    }, [checkAuth]);

    // Redirigir a login si no está autenticado
    useEffect(() => {
        if (!isLoading && !user) {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/index.html';
            }
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        console.log('DashboardApp render - no user, returning null');
        return null;
    }

    // Renderizar contenido según vista activa
    const renderContent = () => {
        const score = user.cliente?.scoreCredito || 950;
        const ingresos = user.cliente?.ingresosMensuales || 0;

        switch (currentView) {
            case 'inicio':
                return (
                    <div className="p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Bienvenido, {user.nombre} 👋
                            </h1>
                            <p className="text-gray-600">
                                Gestiona tus créditos y simula nuevas opciones de financiamiento
                            </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-2xl p-6 shadow">
                                <h3 className="text-lg font-bold mb-4">Score Crediticio</h3>
                                <p className="text-5xl font-bold text-blue-600">{score}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow">
                                <h3 className="text-lg font-bold mb-4">Ingresos Mensuales</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {ingresos > 0 ? `$${ingresos.toLocaleString('es-CL')}` : 'No registrado'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'solicitudes':
                return (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mis Solicitudes</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Aquí verás el historial de tus solicitudes de crédito.</p>
                        </div>
                    </div>
                );
            case 'historial':
                return (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Historial de Simulaciones</h2>
                        <SimulationHistory />
                    </div>
                );
            case 'perfil':
                return (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Gestiona tu información personal.</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-8">
                        <h1>Dashboard</h1>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout currentView={currentView} onNavigate={setCurrentView} user={user}>
            {renderContent()}
        </DashboardLayout>
    );
};
