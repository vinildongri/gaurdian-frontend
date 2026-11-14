"use client";

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Link2, Smartphone, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

// Adjust based on your Next.js env variables for the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function UserDashboard() {
    const [data, setData] = useState({
        accountsCount: 0,
        devicesCount: 0,
        events: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Remove manual token extraction and headers
                const fetchOptions = {
                    // This tells fetch to automatically include cookies in cross-origin requests
                    credentials: 'include' as RequestCredentials,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                const [accountsRes, devicesRes, eventsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/accounts`, fetchOptions),
                    fetch(`${API_BASE_URL}/devices`, fetchOptions),
                    fetch(`${API_BASE_URL}/events`, fetchOptions)
                ]);

                if (!accountsRes.ok || !devicesRes.ok || !eventsRes.ok) {
                    throw new Error('Failed to fetch dashboard data from backend');
                }

                const accounts = await accountsRes.json();
                const devices = await devicesRes.json();
                const events = await eventsRes.json();

                setData({
                    accountsCount: accounts.length || 0,
                    devicesCount: devices.length || 0,
                    events: events.slice(0, 5),
                    loading: false,
                    error: null,
                });

            } catch (err: any) {
                console.error("Dashboard fetch error:", err);
                setData(prev => ({ ...prev, loading: false, error: err.message || 'Failed to load dashboard data.' }));
            }
        };

        fetchDashboardData();
    }, []);
    // Calculate dynamic score based on backend severity levels from Prisma (HIGH, CRITICAL, MEDIUM)
    // Calculate dynamic score based on unresolved backend severity levels
    const calculateRiskScore = () => {
        if (data.events.length === 0) return 100;

        let deductions = 0;
        data.events.forEach((event: any) => {
            // Only penalize the score if the user hasn't recognized/resolved the event yet
            if (event.status !== 'RECOGNIZED') {
                if (event.severity === 'CRITICAL' || event.severity === 'HIGH') deductions += 20;
                if (event.severity === 'MEDIUM') deductions += 5;
            }
        });

        return Math.max(0, 100 - deductions);
    };

    const securityScore = calculateRiskScore();
    const securityScoreData = [
        {
            name: 'Safe',
            value: securityScore,
            color: securityScore > 80 ? '#10B981' : securityScore > 50 ? '#EAB308' : '#EF4444'
        },
        {
            name: 'Risk',
            value: 100 - securityScore,
            // If score is 0, make the whole track red. Otherwise, use the dark slate background.
            color: securityScore === 0 ? '#EF4444' : '#1E293B'
        },
    ];

    if (data.loading) {
        return (
            <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
            <h1 className="text-2xl font-semibold mb-6 text-white">User Dashboard</h1>

            {data.error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
                    {data.error}
                </div>
            )}

            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                <div className="bg-[#131B2C] rounded-xl p-6 flex items-center border border-gray-800/50 shadow-lg">
                    <div className="bg-emerald-500/20 p-4 rounded-lg mr-4 flex-shrink-0">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Account Status</p>
                        <p className={`text-2xl font-bold ${securityScore > 80 ? 'text-emerald-500' : securityScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {securityScore > 80 ? 'Secure' : securityScore > 50 ? 'Needs Attention' : 'At Risk'}
                        </p>
                    </div>
                </div>

                <div className="bg-[#131B2C] rounded-xl p-6 flex items-center border border-gray-800/50 shadow-lg">
                    <div className="bg-blue-500/20 p-4 rounded-lg mr-4 flex-shrink-0">
                        <Link2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Connected Accounts</p>
                        <p className="text-2xl font-bold text-white">{data.accountsCount}</p>
                    </div>
                </div>

                <div className="bg-[#131B2C] rounded-xl p-6 flex items-center border border-gray-800/50 shadow-lg">
                    <div className="bg-purple-500/20 p-4 rounded-lg mr-4 flex-shrink-0">
                        <Smartphone className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Trusted Devices</p>
                        <p className="text-2xl font-bold text-white">{data.devicesCount}</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Activity Feed */}
                <div className="bg-[#131B2C] rounded-xl p-6 border border-gray-800/50 shadow-lg">
                    <h2 className="text-lg font-semibold text-white mb-6">Recent Events</h2>
                    <div className="space-y-6">
                        {data.events.length === 0 ? (
                            <p className="text-gray-400 text-sm">No recent events detected.</p>
                        ) : (
                            data.events.map((event: any) => (
                                <div key={event.id} className="flex items-center">
                                    {event.severity === 'CRITICAL' || event.severity === 'HIGH' ? (
                                        <XCircle className="w-5 h-5 text-red-500 mr-4 flex-shrink-0" />
                                    ) : event.severity === 'MEDIUM' ? (
                                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-4 flex-shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-4 flex-shrink-0" />
                                    )}

                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200 capitalize">
                                            {event.account?.platform || 'Unknown'} • {event.eventType.replace(/_/g, ' ').toLowerCase()}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {event.device || 'Unknown device'} {event.status && `- Status: ${event.status}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(event.createdAt).toLocaleDateString()} {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Security Overview Chart */}
                <div className="bg-[#131B2C] rounded-xl p-6 border border-gray-800/50 shadow-lg">
                    <h2 className="text-lg font-semibold text-white mb-6">Security Overview</h2>

                    <div className="flex flex-col md:flex-row items-center justify-center h-48">
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={securityScoreData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        stroke="none"
                                        paddingAngle={0}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {securityScoreData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-white">{securityScore}%</span>
                                <span className={`text-[10px] mt-1 uppercase tracking-wider font-medium ${securityScore > 80 ? 'text-emerald-500' : securityScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    Security Score
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 md:mt-0 md:ml-8 flex flex-col space-y-4">
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3"></div>
                                <span className="text-sm text-gray-300">Safe</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                                <span className="text-sm text-gray-300">Needs Attention</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                                <span className="text-sm text-gray-300">Threats</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}