import React, { useState } from 'react';
import Head from 'next/head';
import UploadZone from '../components/UploadZone';
import MenuDisplay from '../components/MenuDisplay';

export default function Home() {
  const [extractedMenu, setExtractedMenu] = useState(null);

  return (
    <div className="min-h-screen px-4 py-12 md:py-20 flex flex-col items-center">
      <Head>
        <title>AI Restaurant Menu Scanner</title>
        <meta name="description" content="Scan restaurant menus and extract structured items instantly using Vision AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 mb-4 tracking-tight">
            AI Restaurant Menu Scanner
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Upload menu photos to automatically extract items, categories, pricing, descriptions, and dietary preferences in seconds.
          </p>
        </header>

        <UploadZone onScanComplete={(data) => setExtractedMenu(data)} />

        {extractedMenu && (
          <MenuDisplay menuData={extractedMenu} />
        )}
      </main>
    </div>
  );
}
