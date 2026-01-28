<template>
  <div class="fleet-master-pdf-loading">
    Generating PDF...
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const apiBaseUrl = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')
const vehicles = ref<any[]>([])

const fetchVehicles = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/vehicle-assets/display`)
    vehicles.value = response.data?.data || response.data || []
  } catch (error) {
    vehicles.value = []
  }
}

const buildPdf = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFont('Times', 'Normal')

  doc.setFontSize(12)
  doc.text('BUSHMAN SAFARI TRACKERS LIMITED', doc.internal.pageSize.getWidth() / 2, 48, { align: 'center' })
  doc.setFontSize(11)
  doc.text('FLEET MASTER LIST', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' })

  const body = vehicles.value.length
    ? vehicles.value.map((vehicle: any, index: number) => ([
        `${index + 1}`,
        vehicle.registration_number || '-',
        vehicle.make || '-',
        vehicle.model || '-',
        vehicle.manufacture_year?.toString() || '-',
        vehicle.registration_date || '-',
        vehicle.chassis_number || '-'
      ]))
    : [['-', '-', '-', 'No vehicles found', '-', '-', '-']]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 36
  const marginRight = 36
  const tableWidth = pageWidth - marginLeft - marginRight
  const snWidth = 40
  const regWidth = 120
  const makeWidth = 110
  const modelWidth = 120
  const yearWidth = 80
  const regDateWidth = 120
  const remaining = tableWidth - (snWidth + regWidth + makeWidth + modelWidth + yearWidth + regDateWidth)
  const chassisWidth = Math.max(120, remaining)

  autoTable(doc, {
    head: [['S.No', 'Registration', 'Make', 'Model', 'Year', 'Registration Date', 'Chassis Number']],
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
      fontSize: 9,
      cellPadding: 5,
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
      1: { cellWidth: regWidth },
      2: { cellWidth: makeWidth },
      3: { cellWidth: modelWidth },
      4: { cellWidth: yearWidth, halign: 'center' },
      5: { cellWidth: regDateWidth, halign: 'center' },
      6: { cellWidth: chassisWidth }
    }
  })

  const blobUrl = doc.output('bloburl')
  window.location.replace(blobUrl)
}

onMounted(async () => {
  await fetchVehicles()
  buildPdf()
})
</script>

<style scoped>
.fleet-master-pdf-loading {
  padding: 24px;
  font-family: Arial, sans-serif;
  color: #444;
}
</style>
