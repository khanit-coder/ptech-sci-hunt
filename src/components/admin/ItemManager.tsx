import React, { useState } from 'react';
import { Item, ItemType, ItemStatus } from '@/types';
import { itemService } from '@/services/itemService';
import { soundManager } from '@/lib/sound';
import { 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  EyeOff, 
  Ban, 
  Gift, 
  MapPin, 
  HelpCircle,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  items: Item[];
  itemTypes: ItemType[];
  onRefresh: () => void;
  onOpenQRSheet: (selectedItems?: Item[]) => void;
}

export const ItemManager: React.FC<Props> = ({ items, itemTypes, onRefresh, onOpenQRSheet }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewQrItem, setPreviewQrItem] = useState<Item | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formTypeId, setFormTypeId] = useState(itemTypes[0]?.id || '');
  const [formStatus, setFormStatus] = useState<ItemStatus>('active');
  const [formLocationHint, setFormLocationHint] = useState('');
  const [formHint, setFormHint] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRewardName, setFormRewardName] = useState('');
  const [formRewardQuantity, setFormRewardQuantity] = useState(1);

  const openCreateModal = () => {
    soundManager.playClick();
    setFormCode(`ITEM-${String(items.length + 1).padStart(3, '0')}`);
    setFormName('');
    setFormTypeId(itemTypes[0]?.id || '');
    setFormStatus('active');
    setFormLocationHint('');
    setFormHint('');
    setFormDescription('');
    setFormRewardName('Special Prize');
    setFormRewardQuantity(1);
    setIsCreating(true);
  };

  const openEditModal = (item: Item) => {
    soundManager.playClick();
    setEditingItem(item);
    setFormCode(item.item_code);
    setFormName(item.name);
    setFormTypeId(item.item_type_id);
    setFormStatus(item.status);
    setFormLocationHint(item.location_hint || '');
    setFormHint(item.hint || '');
    setFormDescription(item.description || '');
    setFormRewardName(item.reward_name || 'Special Prize');
    setFormRewardQuantity(item.reward_quantity || 1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    try {
      if (isCreating) {
        await itemService.createItem({
          item_code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          item_type_id: formTypeId,
          qr_token: 'tok_' + Math.random().toString(36).substring(2, 12),
          status: formStatus,
          location_hint: formLocationHint.trim(),
          hint: formHint.trim(),
          description: formDescription.trim(),
          reward_name: formRewardName.trim(),
          reward_quantity: formRewardQuantity,
          sort_order: items.length + 1,
        });
        setIsCreating(false);
      } else if (editingItem) {
        await itemService.updateItem(editingItem.id, {
          item_code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          item_type_id: formTypeId,
          status: formStatus,
          location_hint: formLocationHint.trim(),
          hint: formHint.trim(),
          description: formDescription.trim(),
          reward_name: formRewardName.trim(),
          reward_quantity: formRewardQuantity,
        });
        setEditingItem(null);
      }
      onRefresh();
    } catch (err: any) {
      alert('Error saving item: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไอเทมนี้?')) return;
    soundManager.playClick();
    await itemService.deleteItem(id);
    onRefresh();
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_hint?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || item.item_type_id === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Action Header & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search & Type Select */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อไอเทม..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-mario-orange"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-mario-orange"
          >
            <option value="ALL">ทุกประเภท ({items.length})</option>
            {itemTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQRSheet(filteredItems)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-mario-yellow" />
            <span>พิมพ์ QR Sheet ({filteredItems.length})</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white text-xs font-bold shadow-neon-red hover:opacity-95 transition-opacity flex items-center gap-1.5 pixel-btn"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มไอเทมใหม่</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">รหัส</th>
                <th className="py-3.5 px-4">ชื่อไอเทม</th>
                <th className="py-3.5 px-4">ประเภท</th>
                <th className="py-3.5 px-4">จุดซ่อน / คำใบ้</th>
                <th className="py-3.5 px-4">ของรางวัล</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredItems.map((item) => {
                const type = itemTypes.find((t) => t.id === item.item_type_id) || item.item_type;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Item Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-mario-yellow border border-slate-800">
                        {item.item_code}
                      </span>
                    </td>

                    {/* Item Name */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block truncate max-w-[200px]">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        token: {item.qr_token.substring(0, 10)}...
                      </span>
                    </td>

                    {/* Category Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1"
                        style={{ backgroundColor: `${type?.color || '#FFD700'}20`, color: type?.color || '#FFD700' }}
                      >
                        <span>{type?.icon}</span>
                        <span>{type?.name}</span>
                      </span>
                    </td>

                    {/* Location & Clue */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="truncate flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-mario-orange shrink-0" />
                        <span>{item.location_hint || '-'}</span>
                      </div>
                      {item.hint && (
                        <div className="truncate text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item.hint}</span>
                        </div>
                      )}
                    </td>

                    {/* Reward */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-mario-green" />
                        <span>{item.reward_name || 'Special Prize'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.status === 'discovered'
                          ? 'bg-mario-green/20 text-mario-green border border-mario-green/40'
                          : item.status === 'active'
                          ? 'bg-mario-orange/20 text-mario-orange border border-mario-orange/40'
                          : item.status === 'disabled'
                          ? 'bg-red-950/60 text-red-400 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewQrItem(item)}
                          title="ดู QR Code"
                          className="p-1.5 rounded-lg bg-slate-800 text-mario-yellow hover:bg-slate-700"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="แก้ไข"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title="ลบ"
                          className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Item */}
      {(isCreating || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-game text-xs text-mario-yellow">
                {isCreating ? 'CREATE NEW ITEM' : `EDIT ITEM: ${editingItem?.item_code}`}
              </h3>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingItem(null); }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">รหัสไอเทม (Code)</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="เช่น STAR-006"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ประเภทไอเทม</label>
                  <select
                    value={formTypeId}
                    onChange={(e) => setFormTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    {itemTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อไอเทม (Display Name)</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น STAR CORE #06 - Quantum Pulse"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">สถานะ</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="active">ACTIVE (พร้อมตามล่า)</option>
                    <option value="discovered">DISCOVERED (ค้นพบแล้ว)</option>
                    <option value="disabled">DISABLED (ปิดใช้งาน)</option>
                    <option value="hidden">HIDDEN (ซ่อน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ของรางวัล</label>
                  <input
                    type="text"
                    value={formRewardName}
                    onChange={(e) => setFormRewardName(e.target.value)}
                    placeholder="เช่น Flash Drive 64GB"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">จุดซ่อนไอเทม (Location Hint)</label>
                <input
                  type="text"
                  value={formLocationHint}
                  onChange={(e) => setFormLocationHint(e.target.value)}
                  placeholder="เช่น ห้องปฏิบัติการเคมี ชั้น 3 โต๊ะกลาง"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ปริศนา / คำใบ้วิทยาศาสตร์ (Science Hint)</label>
                <textarea
                  rows={2}
                  value={formHint}
                  onChange={(e) => setFormHint(e.target.value)}
                  placeholder="เช่น สเปกตรัมแสงที่มีความยาวคลื่นสั้นที่สุด..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingItem(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-bold shadow-neon-red"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Item QR Preview Modal */}
      {previewQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-sm w-full bg-slate-900 border-2 border-mario-yellow rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-mono font-bold text-xs text-mario-yellow">{previewQrItem.item_code}</span>
              <button onClick={() => setPreviewQrItem(null)} className="p-1 rounded bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-inner">
              <QRCodeSVG value={previewQrItem.qr_token} size={200} level="H" includeMargin={true} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{previewQrItem.name}</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">Token: {previewQrItem.qr_token}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head><title>Print QR - ${previewQrItem.item_code}</title></head>
                      <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                        <h2>PTECH-Sci 2026 : Secret Item</h2>
                        <h1>${previewQrItem.item_code}</h1>
                        <h3>${previewQrItem.name}</h3>
                        <div id="qr"></div>
                        <p style="font-size:12px; margin-top:20px;">สแกนเพื่อกู้คืนมิติโลก PTECH</p>
                        <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
                        <script>
                          QRCode.toCanvas('${previewQrItem.qr_token}', { width: 300 }, function (err, canvas) {
                            document.getElementById('qr').appendChild(canvas);
                            window.print();
                          });
                        </script>
                      </body>
                    </html>
                  `);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-mario-yellow text-slate-950 font-bold text-xs"
            >
              พิมพ์การ์ดใบนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
