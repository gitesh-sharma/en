(function () {
  const dob = document.getElementById('dob');
  const asOf = document.getElementById('asOf');
  const calcAgeBtn = document.getElementById('calcAgeBtn');
  const ageResult = document.getElementById('ageResult');
  const ageYears = document.getElementById('ageYears');
  const ageMonths = document.getElementById('ageMonths');
  const ageDays = document.getElementById('ageDays');
  const ageExtra = document.getElementById('ageExtra');
  const ageStatus = document.getElementById('ageStatus');

  const today = new Date();
  asOf.value = today.toISOString().slice(0, 10);

  calcAgeBtn.addEventListener('click', () => {
    ageStatus.style.display = 'none';
    if (!dob.value) {
      showStatus(ageStatus, 'Pick a date of birth first.', 'error');
      ageStatus.style.display = 'block';
      return;
    }
    const start = new Date(dob.value + 'T00:00:00');
    const end = new Date((asOf.value || today.toISOString().slice(0, 10)) + 'T00:00:00');
    if (start > end) {
      showStatus(ageStatus, 'The date of birth is after the "as of" date — check the dates.', 'error');
      ageStatus.style.display = 'block';
      return;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    ageYears.textContent = years;
    ageMonths.textContent = months;
    ageDays.textContent = days;
    ageExtra.textContent = `That's ${totalDays.toLocaleString()} days, or about ${totalWeeks.toLocaleString()} weeks, in total.`;
    ageResult.style.display = 'block';
  });
})();
