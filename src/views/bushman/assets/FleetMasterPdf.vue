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
        vehicle.model || '-',
        vehicle.make || '-',
        vehicle.manufacture_year?.toString() || '-',
        vehicle.registration_date || '-',
        vehicle.chassis_number || '-'
      ]))
    : [['-', '-', '-', 'No vehicles found', '-', '-']]

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 36
  const marginRight = 36
  // Only sum the widths of the actual columns
  const snWidth = 22
  const yearWidth = 60
  const modelWidth = 110
  const regDateWidth = 70
  // No extra column, so no need to calculate remaining/tableWidth for an extra column

  autoTable(doc, {
    head: [['S.No', 'Registration', 'Model', 'Make', 'Year', 'Registration Date', 'Chassis Number']],
    body,
    startY: 90,
    theme: 'grid',
    showHead: 'everyPage',
    margin: { top: 70, left: 20, right: 20, bottom: 20 },
    tableLineWidth: 0.5,
    tableLineColor: 0,
    styles: {
      font: 'times',
      fontStyle: 'normal',
      fontSize: 7,
      cellPadding: 1,
      valign: 'top',
      textColor: 0,
      lineWidth: 0.5,
      lineColor: 0
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.5,
      lineColor: 0
    },
    columnStyles: {
      0: { cellWidth: snWidth, halign: 'center' },
      1: { halign: 'center' },
      2: { cellWidth: modelWidth, halign: 'center' },
      3: { halign: 'center' },
      4: { cellWidth: yearWidth, halign: 'center' },
      5: { cellWidth: regDateWidth, halign: 'center' },
      6: { halign: 'center' }
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
