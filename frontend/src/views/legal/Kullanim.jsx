import React from 'react';
import MarketingLayout from '../../ui/MarketingLayout';
import { frostedPageCard, pageSectionPadding } from '../../ui/classNames';

export default function KullanimKosullariPage() {
  return (
    <MarketingLayout>
      <div className={pageSectionPadding}>
        <div className={`max-w-3xl mx-auto ${frostedPageCard} text-slate-800`}>
          <h1 className="text-3xl font-extrabold text-slate-900">Kullanım Koşulları</h1>
          <p className="mt-3 text-sm text-slate-500">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vitae optio odit minus sint
            quasi aperiam impedit dolores, minima laboriosam voluptatem, nobis natus amet molestias
            illo placeat doloremque voluptates laudantium voluptatum!
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
