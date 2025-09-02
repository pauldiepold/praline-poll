<template>
  <div class="print:block print:max-w-none print:my-0 print:p-0 print:fixed print:inset-0 print:z-50">
    <div class="print-container">
      Hallo Welt 123
      <slot />
    </div>
  </div>
</template>

<style scoped>
@media print {
  .print-container {
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm;
    background: white;
    color: black;
    font-family: Arial, sans-serif;
  }
}
</style>
