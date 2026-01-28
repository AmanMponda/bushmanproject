<template>
  <div class="supplier-pdf-loading">
    Generating PDF...
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const suppliers = ref<any[]>([])

const fetchSuppliers = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/suppliers`)
    suppliers.value = response.data?.data || response.data || []
  } catch (error) {
    suppliers.value = []
  }
}

const buildPdf = () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  doc.setFont('Times', 'Normal')

  doc.setFontSize(12)
  doc.text('BUSHMAN SAFARI TRACKERS LIMITED', doc.internal.pageSize.getWidth() / 2, 48, { align: 'center' })
  doc.setFontSize(11)
  doc.text('SUPPLIERS LIST', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' })

  const body = suppliers.value.length
    ? suppliers.value.map((supplier: any, index: number) => ([
        `${index + 1}`,
        supplier.name || '-',
        supplier.notes || '-'
      ]))
    : [['-', 'No suppliers found', '-']]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 40
  const marginRight = 40
  const tableWidth = pageWidth - marginLeft - marginRight
  const snWidth = 50
  const remaining = tableWidth - snWidth
  const colWidth = Math.floor(remaining / 2)

  autoTable(doc, {
    head: [['S.No', 'Name of Supplier', 'Remarks/Purpose']],
    body,
    startY: 90,
    theme: 'grid',
    showHead: 'everyPage',
    margin: { top: 90, left: marginLeft, right: marginRight, bottom: 40 },
    tableWidth,
    tableLineWidth: 0.75,
    tableLineColor: 0,
    styles: {
      font: 'Times',
      fontSize: 10,
      cellPadding: 6,
      valign: 'top',
      textColor: 0,
      lineWidth: 0.75,
      lineColor: 0
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.75,
      lineColor: 0
    },
    columnStyles: {
      0: { cellWidth: snWidth, halign: 'center' },
      1: { cellWidth: colWidth },
      2: { cellWidth: colWidth }
    }
  })

  const blobUrl = doc.output('bloburl')
  window.location.replace(blobUrl)
}

onMounted(async () => {
  await fetchSuppliers()
  buildPdf()
})
</script>

<style scoped>
.supplier-pdf-loading {
  padding: 24px;
  font-family: Arial, sans-serif;
  color: #444;
}
</style>
