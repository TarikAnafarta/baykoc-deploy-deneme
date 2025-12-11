import React from 'react';
import MarketingLayout from '../../ui/MarketingLayout';
import { frostedPageCard, pageSectionPadding } from '../../ui/classNames';

export default function Hakkimizda() {
  return (
    <MarketingLayout>
      <div className={pageSectionPadding}>
        <div className={`max-w-4xl mx-auto ${frostedPageCard}`}>
          <h1 className="text-2xl font-extrabold">Hakkımızda</h1>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
