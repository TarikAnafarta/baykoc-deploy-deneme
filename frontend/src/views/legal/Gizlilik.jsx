import React from 'react';
import MarketingLayout from '../../ui/MarketingLayout';
import { frostedPageCard, pageSectionPadding } from '../../ui/classNames';

export default function GizlilikPage() {
  return (
    <MarketingLayout>
      <div className={pageSectionPadding}>
        <div className={`max-w-3xl mx-auto ${frostedPageCard} text-slate-800`}>
          <h1 className="text-3xl font-extrabold text-slate-900">Gizlilik Politikası</h1>
          <p className="mt-3 text-sm text-slate-500">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam adipisci provident animi
            quibusdam neque dolores fugiat sunt. Repudiandae fugit blanditiis assumenda ipsam.
            Accusamus explicabo quam illo veniam voluptatum, esse reiciendis.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
