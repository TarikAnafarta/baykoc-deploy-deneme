import React from 'react';
import MarketingLayout from '../../ui/MarketingLayout';
import { pageSectionPadding } from '../../ui/classNames';
import tarikPhoto from '../../assets/team/tarik.jpg';
import berkayPhoto from '../../assets/team/berkay.jpg';
import ilginPhoto from '../../assets/team/ilgin.jpg';
import yagmurPhoto from '../../assets/team/yagmur.jpg';
import linkedinIcon from '../../assets/icons/linkedin.svg';

const members = [
  {
    name: 'Tarık Anafarta',
    role: 'rol 1',
    photo: tarikPhoto,
    linkedin: 'https://www.linkedin.com/in/tarik-anafarta',
  },
  {
    name: 'Berkay Eren',
    role: 'rol 2',
    photo: berkayPhoto,
    linkedin: 'https://www.linkedin.com/in/berkayeren',
  },
  {
    name: 'Ilgın Tandoğan',
    role: 'DEVOPS ENGINEER',
    photo: ilginPhoto,
    linkedin: 'https://www.linkedin.com/in/ilgintandogan',
  },
  {
    name: 'Yağmur Göçmen',
    role: 'rol 4',
    photo: yagmurPhoto,
    linkedin: 'https://www.linkedin.com/in/yagmurgocmen',
  },
];

export default function Ekibimiz() {
  return (
    <MarketingLayout>
      <div className={pageSectionPadding}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Ekibimiz</h1>
          <div className="flex flex-nowrap gap-3 justify-between">
            {members.map((m) => (
              <div key={m.name} className="w-1/4">
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-start gap-4">
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-full h-56 object-cover rounded-xl"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  <div className="w-full">
                    <div className="text-lg font-bold">{m.name}</div>
                    <div className="text-sm text-slate-500 mt-1 mb-3">{m.role}</div>
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50"
                    >
                      <img src={linkedinIcon} alt="LinkedIn" className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
