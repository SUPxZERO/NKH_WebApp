import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Modal from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Grid, Plus, Edit, Trash2 } from 'lucide-react';

interface Table {
  id: number;
  number: string;
  capacity: number;
  x: number;
  y: number;
  status: 'available' | 'occupied' | 'reserved';
  floor_id: number;
}

interface Floor {
  id: number;
  name: string;
  width: number;
  height: number;
}

interface Props {
  floors: Floor[];
  tables: Table[];
  selectedFloor: number;
  onFloorSelect: (floorId: number) => void;
  onTableUpdate: (table: Partial<Table>) => void;
  onTableCreate: (table: Omit<Table, 'id'>) => void;
  onTableDelete: (tableId: number) => void;
}

export default function TableFloorManager({
  floors,
  tables,
  selectedFloor,
  onFloorSelect,
  onTableUpdate,
  onTableCreate,
  onTableDelete
}: Props) {
  const [draggedTable, setDraggedTable] = useState<number | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    number: '',
    capacity: 4,
    x: 100,
    y: 100
  });

  const currentFloor = floors.find(f => f.id === selectedFloor);
  const currentTables = tables.filter(t => t.floor_id === selectedFloor);

  const handleDragStart = (e: React.DragEvent, tableId: number) => {
    setDraggedTable(tableId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable || !currentFloor) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onTableUpdate({
      id: draggedTable,
      x: Math.max(0, Math.min(x, currentFloor.width - 60)),
      y: Math.max(0, Math.min(y, currentFloor.height - 60))
    });

    setDraggedTable(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const openCreateModal = () => {
    setEditingTable(null);
    setTableForm({ number: '', capacity: 4, x: 100, y: 100 });
    setShowTableModal(true);
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setTableForm({
      number: table.number,
      capacity: table.capacity,
      x: table.x,
      y: table.y
    });
    setShowTableModal(true);
  };

  const handleSaveTable = () => {
    if (editingTable) {
      onTableUpdate({ ...editingTable, ...tableForm });
    } else {
      onTableCreate({
        ...tableForm,
        status: 'available',
        floor_id: selectedFloor
      });
    }
    setShowTableModal(false);
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-rose-500/80 border-rose-400';
      case 'reserved': return 'bg-orange-500/80 border-orange-400';
      default: return 'bg-emerald-500/80 border-emerald-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5" />
            <h3 className="font-semibold">Floor Plan Manager</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedFloor}
              onChange={(e) => onFloorSelect(Number(e.target.value))}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-1 text-sm"
            >
              {floors.map(floor => (
                <option key={floor.id} value={floor.id}>{floor.name}</option>
              ))}
            </select>
            <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
              Add Table
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentFloor ? (
          <div className="space-y-4">
            {/* Floor Plan Canvas */}
            <div
              className="relative border-2 border-dashed border-white/20 rounded-xl bg-white/5 overflow-hidden"
              style={{ width: '100%', height: '400px' }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="absolute inset-2">
                {currentTables.map(table => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, table.id)}
                    className={`absolute w-14 h-14 rounded-xl border-2 cursor-move flex flex-col items-center justify-center text-xs font-medium text-white shadow-lg transition-transform hover:scale-105 ${getTableStatusColor(table.status)}`}
                    style={{
                      left: `${table.x}px`,
                      top: `${table.y}px`
                    }}
                    onClick={() => openEditModal(table)}
                  >
                    <div>{table.number}</div>
                    <div className="text-[10px] opacity-80">{table.capacity}p</div>
                  </div>
                ))}
              </div>
              
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/80"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500/80"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500/80"></div>
                <span>Occupied</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No floor selected
          </div>
        )}

        {/* Table Modal */}
        <Modal open={showTableModal} onClose={() => setShowTableModal(false)} title={editingTable ? 'Edit Table' : 'Add Table'}>
          <div className="space-y-3">
            <Input
              label="Table Number"
              value={tableForm.number}
              onChange={(e) => setTableForm(prev => ({ ...prev, number: e.target.value }))}
              placeholder="e.g. T1, A5"
            />
            <Input
              label="Capacity"
              type="number"
              value={tableForm.capacity}
              onChange={(e) => setTableForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
              min="1"
              max="12"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="X Position"
                type="number"
                value={tableForm.x}
                onChange={(e) => setTableForm(prev => ({ ...prev, x: Number(e.target.value) }))}
              />
              <Input
                label="Y Position"
                type="number"
                value={tableForm.y}
                onChange={(e) => setTableForm(prev => ({ ...prev, y: Number(e.target.value) }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowTableModal(false)}>Cancel</Button>
              {editingTable && (
                <Button variant="danger" onClick={() => {
                  onTableDelete(editingTable.id);
                  setShowTableModal(false);
                }}>
                  Delete
                </Button>
              )}
              <Button onClick={handleSaveTable}>
                {editingTable ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
}
