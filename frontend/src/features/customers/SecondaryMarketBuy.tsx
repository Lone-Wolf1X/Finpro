import React from 'react';
import TradingTab from './TradingTab';

export default function SecondaryMarketBuy() {
    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800">Buy Shares</h1>
                <p className="text-sm text-gray-500">Secondary Market Trading</p>
            </div>
            <TradingTab />
        </div>
    );
}
