import React, { useState } from 'react';
import { Equipment } from '../types';
import { X, Save, Sliders, Check } from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  equipment: Equipment;
  onSave: (eq: Equipment) => void;
  onClose: () => void;
}

const PRESET_DRONES = [
  'Standard Hexa-Drone A1',
  'DJI Matrice 350 RTK',
  'DJI Mavic 3 Enterprise',
  'DJI Inspire 3',
  'Autel EVO Max 4T',
  'Custom FPV Cinelifter 7"',
];

const PRESET_BATTERIES = [
  'LiPo 6S 5000mAh (#BAT-01)',
  'LiPo 6S 5000mAh (#BAT-02)',
  'TB65 Intelligent Flight Battery (DJI)',
  'LiPo 4S 1500mAh 100C',
  'Solid-State Li-Ion 6S 10000mAh',
];

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  equipment,
  onSave,
  onClose,
}) => {
  const [droneModel, setDroneModel] = useState(equipment.droneModel);
  const [batteryModel, setBatteryModel] = useState(equipment.batteryModel);
  const [capacity, setCapacity] = useState(equipment.batteryCapacityMah);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      droneModel: droneModel.trim() || 'Standard Hexa-Drone A1',
      batteryModel: batteryModel.trim() || 'LiPo 6S 5000mAh (#BAT-01)',
      batteryCapacityMah: Number(capacity) || 5000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-5 backdrop-blur-xs">
      <div className="bg-[#1a1e28] rounded-[20px] max-w-[400px] w-full p-5 border border-[#2e3648] shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders size={18} className="text-[#4fd1c5]" />
            <span>장비 정보 설정</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Drone model */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">기체 모델명</label>
            <input
              type="text"
              value={droneModel}
              onChange={(e) => setDroneModel(e.target.value)}
              className="w-full bg-[#12141a] border border-[#2e3648] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00E676]"
              placeholder="예: Standard Hexa-Drone A1"
              required
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {PRESET_DRONES.slice(0, 3).map((drone) => (
                <button
                  type="button"
                  key={drone}
                  onClick={() => setDroneModel(drone)}
                  className="px-2 py-0.5 rounded bg-[#12141a] hover:bg-[#252a36] text-[0.68rem] text-gray-400 hover:text-white border border-[#252a36]"
                >
                  {drone}
                </button>
              ))}
            </div>
          </div>

          {/* Battery model */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">배터리 사양 및 식별번호</label>
            <input
              type="text"
              value={batteryModel}
              onChange={(e) => setBatteryModel(e.target.value)}
              className="w-full bg-[#12141a] border border-[#2e3648] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00E676]"
              placeholder="예: LiPo 6S 5000mAh (#BAT-01)"
              required
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {PRESET_BATTERIES.slice(0, 3).map((bat) => (
                <button
                  type="button"
                  key={bat}
                  onClick={() => setBatteryModel(bat)}
                  className="px-2 py-0.5 rounded bg-[#12141a] hover:bg-[#252a36] text-[0.68rem] text-gray-400 hover:text-white border border-[#252a36]"
                >
                  {bat}
                </button>
              ))}
            </div>
          </div>

          {/* Battery Capacity */}
          <div>
            <label className="block text-gray-400 mb-1 font-semibold">배터리 용량 (mAh)</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-[#12141a] border border-[#2e3648] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00E676]"
              min="500"
              max="50000"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-[#252a36] text-gray-300 font-semibold hover:bg-[#2f3545] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-[#00E676] text-black font-extrabold hover:bg-[#00c853] transition-colors flex items-center justify-center gap-1"
            >
              <Check size={15} />
              <span>저장 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
