(function () {
  const $ = id => document.getElementById(id);
  let allCases = [];
  let activeFilter = 'all';

  $('qtg-example').onclick = () => {
    $('qtg-input').value = "As a registered user, I want to reset my password via email so that I can regain access to my account if I forget it.";
  };

  $('qtg-go').onclick = generate;

  async function generate() {
    const story = $('qtg-input').value.trim();
    if (!story) { showError('Write a user story first.'); return; }

    $('qtg-error').style.display = 'none';
    $('qtg-results').style.display = 'none';
    $('qtg-go').disabled = true;
    $('qtg-status').innerHTML = 'analyzing<span class="spinner"></span>';
    $('qtg-console').style.display = 'block';
    $('qtg-console').innerHTML = '<div class="line">$ analyzing requirement...</div>';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      allCases = data.cases || [];
      $('qtg-console').innerHTML += `<div class="line ok">$ generated ${allCases.length} test cases \u2713</div>`;
      $('qtg-code').textContent = data.playwright || '';
      renderTabs();
      renderCases();
      $('qtg-results').style.display = 'block';
      $('qtg-status').textContent = '';
    } catch (err) {
      showError('Something went wrong: ' + err.message);
      $('qtg-console').innerHTML += `<div class="line" style="color:#E24B4A">$ error: ${escapeHtml(err.message)}</div>`;
      $('qtg-status').textContent = '';
    } finally {
      $('qtg-go').disabled = false;
    }
  }

  function showError(msg) {
    $('qtg-error').style.display = 'block';
    $('qtg-error').textContent = msg;
  }

  function renderTabs() {
    const counts = { all: allCases.length };
    ['positive', 'negative', 'edge'].forEach(c => counts[c] = allCases.filter(x => x.category === c).length);
    const labels = { all: 'All', positive: 'Positive', negative: 'Negative', edge: 'Edge' };
    $('qtg-tabs').innerHTML = Object.keys(labels).map(key =>
      `<div class="tab ${activeFilter === key ? 'active' : ''}" data-filter="${key}">${labels[key]} (${counts[key] || 0})</div>`
    ).join('');
    $('qtg-tabs').querySelectorAll('.tab').forEach(el => {
      el.onclick = () => { activeFilter = el.dataset.filter; renderTabs(); renderCases(); };
    });
  }

  function renderCases() {
    const filtered = activeFilter === 'all' ? allCases : allCases.filter(c => c.category === activeFilter);
    $('qtg-cases').innerHTML = filtered.map(c => `
      <div class="case">
        <div class="case-head">
          <span class="badge ${c.category}">${c.category}</span>
          <span class="case-title">${escapeHtml(c.title)}</span>
        </div>
        <ol class="steps">${(c.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
        <div class="expected"><b>Expected:</b> ${escapeHtml(c.expected || '')}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  $('qtg-copy').onclick = () => {
    navigator.clipboard.writeText($('qtg-code').textContent);
    $('qtg-copy').textContent = 'copied \u2713';
    setTimeout(() => $('qtg-copy').textContent = 'copy', 1500);
  };
})();
