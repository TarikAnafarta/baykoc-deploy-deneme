import React from 'react';
import MarketingLayout from '../../ui/MarketingLayout';
import { frostedPageCard, pageSectionPadding } from '../../ui/classNames';

export default function IletisimPage() {
  return (
    <MarketingLayout>
      <div className={pageSectionPadding}>
        <div className={`max-w-4xl mx-auto ${frostedPageCard} text-slate-800`}>
          <h1 className="text-3xl font-extrabold text-slate-900">İletişim</h1>
          <p className="mt-3 text-sm text-slate-500">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt fuga deserunt ab
            incidunt facilis possimus magni, doloribus cumque, distinctio eos obcaecati explicabo,
            nam esse iure ipsa praesentium ad odit necessitatibus.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Destek</h2>
              <p className="mt-2 text-slate-600">
                Teknik sorunlar, hesap talepleri veya ürün önerileri için destek ekibimizle
                iletişime geçin.
              </p>
              {/*email adresi eklenecek*/}
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">İş Birlikleri</h2>
              <p className="mt-2 text-slate-600">
                Eğitim kurumları ve paydaşlarıyla yeni projeler geliştirmek için açığız. Bizimle
                çalışmak isterseniz ekibimizle iletişime geçin.
              </p>
              {/*email adresi eklenecek*/}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Adres</h2>
            <p className="mt-2 text-slate-600">
              Bilkent Üniversitesi, Üniversiteler Mahallesi, 06800 Çankaya/Ankara
            </p>
            <p className="mt-2 text-slate-600">Çalışma Saatleri: Hafta içi 09:00 - 18:00</p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
