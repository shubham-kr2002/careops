'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Package, Plus, Search, Filter, MoreVertical, AlertTriangle, TrendingUp, TrendingDown, Edit2, Trash2, X } from 'lucide-react'
import { useInventoryItems, useLowStockItems, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useCreateInventoryTransaction, InventoryItem } from '@/lib/api'

// Sample categories
const categories = ['All', 'Supplies', 'Equipment', 'Parts', 'Consumables', 'Other']

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [transactionType, setTransactionType] = useState<'purchase' | 'use' | 'adjustment'>('purchase')

  const { data: inventoryItems, isLoading: itemsLoading } = useInventoryItems()
  const { data: lowStockItems } = useLowStockItems()
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const createTransaction = useCreateInventoryTransaction()

  // Filter items
  const filteredItems = inventoryItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  }) || []

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await createItem.mutateAsync({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      sku: formData.get('sku') as string || undefined,
      category: formData.get('category') as string || undefined,
      total_quantity: parseFloat(formData.get('total_quantity') as string) || 0,
      min_threshold: parseFloat(formData.get('min_threshold') as string) || undefined,
      unit_cost: parseFloat(formData.get('unit_cost') as string) || undefined,
      unit_price: parseFloat(formData.get('unit_price') as string) || undefined,
      unit: formData.get('unit') as string || undefined,
    })
    setShowAddModal(false)
  }

  const handleTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return
    const formData = new FormData(e.currentTarget)
    await createTransaction.mutateAsync({
      item_id: selectedItem.id,
      transaction_type: transactionType,
      quantity: parseFloat(formData.get('quantity') as string),
      notes: formData.get('notes') as string || undefined,
    })
    setShowTransactionModal(false)
    setSelectedItem(null)
  }

  const openTransactionModal = (item: InventoryItem, type: 'purchase' | 'use' | 'adjustment') => {
    setSelectedItem(item)
    setTransactionType(type)
    setShowTransactionModal(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem.mutateAsync(itemId)
    }
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Inventory</h1>
          <p className="text-[var(--neutral-500)] mt-1">Manage your stock and supplies</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--neutral-500)]">Total Items</p>
              <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">{inventoryItems?.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--neutral-500)]">Total Value</p>
              <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">
                ${inventoryItems?.reduce((sum, item) => sum + (item.unit_cost || 0) * item.available_quantity, 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--neutral-500)]">Low Stock Items</p>
              <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">{lowStockItems?.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          {lowStockItems && lowStockItems.length > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              Items need attention
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--neutral-500)]">Categories</p>
              <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">
                {new Set(inventoryItems?.map(i => i.category).filter(Boolean)).size || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden">
        {itemsLoading ? (
          <div className="p-8 text-center text-[var(--neutral-500)]">Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-[var(--neutral-500)]">
            <Package className="w-12 h-12 mx-auto mb-4 text-[var(--neutral-300)]" />
            <p>No inventory items found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-200)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-200)]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--neutral-50)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-100)] flex items-center justify-center">
                          <Package className="w-5 h-5 text-[var(--primary-600)]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--neutral-900)]">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-[var(--neutral-500)] truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--neutral-600)]">{item.sku || '-'}</td>
                    <td className="px-6 py-4 text-sm text-[var(--neutral-600)]">{item.category || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--neutral-900)]">
                          {item.available_quantity} {item.unit}
                        </span>
                        {item.reserved_quantity > 0 && (
                          <span className="text-xs text-[var(--neutral-400)]">
                            ({item.reserved_quantity} reserved)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--neutral-600)]">
                      ${item.unit_cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <TrendingDown className="w-3 h-3" />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openTransactionModal(item, 'purchase')}
                          className="p-2 hover:bg-[var(--neutral-100)] rounded-lg transition-colors text-green-600"
                          title="Add Stock"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openTransactionModal(item, 'use')}
                          className="p-2 hover:bg-[var(--neutral-100)] rounded-lg transition-colors text-amber-600"
                          title="Use Item"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 hover:bg-[var(--neutral-100)] rounded-lg transition-colors text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[var(--neutral-200)]">
              <h2 className="text-lg font-semibold text-[var(--neutral-900)]">Add Inventory Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                <X className="w-5 h-5 text-[var(--neutral-500)]" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Name *</label>
                <input
                  name="name"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">SKU</label>
                  <input
                    name="sku"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Initial Quantity</label>
                  <input
                    name="total_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Unit</label>
                  <input
                    name="unit"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                    placeholder="pieces, liters, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Min Threshold</label>
                  <input
                    name="min_threshold"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                    placeholder="Low stock alert level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Unit Cost ($)</label>
                  <input
                    name="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Unit Price ($)</label>
                <input
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--neutral-200)] rounded-lg text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending}
                  className="flex-1 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {createItem.isPending ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[var(--neutral-200)]">
              <h2 className="text-lg font-semibold text-[var(--neutral-900)]">
                {transactionType === 'purchase' ? 'Add Stock' : transactionType === 'use' ? 'Use Item' : 'Adjust Quantity'}
              </h2>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                <X className="w-5 h-5 text-[var(--neutral-500)]" />
              </button>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div className="p-4 bg-[var(--neutral-50)] rounded-lg">
                <p className="text-sm font-medium text-[var(--neutral-900)]">{selectedItem.name}</p>
                <p className="text-xs text-[var(--neutral-500)]">
                  Current: {selectedItem.available_quantity} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Transaction Type</label>
                <div className="flex gap-2">
                  {(['purchase', 'use', 'adjustment'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransactionType(type)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        transactionType === type
                          ? type === 'purchase' 
                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                            : type === 'use'
                              ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                              : 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-white border border-[var(--neutral-200)] text-[var(--neutral-600)] hover:bg-[var(--neutral-50)]'
                      }`}
                    >
                      {type === 'purchase' ? 'Add' : type === 'use' ? 'Use' : 'Set'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">
                  Quantity {transactionType === 'adjustment' ? '(new total)' : ''}
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neutral-700)] mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--neutral-200)] rounded-lg text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTransaction.isPending}
                  className="flex-1 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {createTransaction.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
