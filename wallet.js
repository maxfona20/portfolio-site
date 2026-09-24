(() => {
  'use strict';
  let instanceCount = 0;
  const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
  const money = (cents) => currency.format(cents / 100);

  window.initPortfolioWallet = (container) => {
    if (!container || typeof container.replaceChildren !== 'function') return;
    const prefix = `sample-wallet-${++instanceCount}`;
    let balance = 12500;
    let transactions = [];
    const recipients = ['Alex', 'Jamie', 'Sam'];

    function make(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    const wallet = make('div', 'wallet-demo');
    const top = make('div', 'wallet-top');
    const disclosure = make('p', 'eyebrow', 'INTERACTIVE CONCEPT · NO REAL PAYMENTS');
    const balanceLabel = make('p', 'wallet-balance-label', 'Sample balance');
    const balanceValue = make('strong', 'wallet-balance mono', money(balance));
    balanceLabel.append(balanceValue);
    top.append(disclosure, balanceLabel);

    const form = make('form', 'wallet-form');
    form.noValidate = true;
    const people = make('fieldset', 'wallet-people');
    people.append(make('legend', '', 'Choose a sample recipient'));
    const radios = recipients.map((name, index) => {
      const label = make('label', 'wallet-person');
      const radio = make('input');
      radio.type = 'radio';
      radio.name = `${prefix}-recipient`;
      radio.value = name;
      radio.checked = index === 0;
      const avatar = make('span', 'wallet-avatar', name.charAt(0));
      avatar.setAttribute('aria-hidden', 'true');
      label.append(radio, avatar, make('span', 'wallet-person-name', name));
      people.append(label);
      return radio;
    });

    const amountGroup = make('div', 'wallet-amount');
    const amountLabel = make('label', '', 'Sample amount (USD)');
    amountLabel.htmlFor = `${prefix}-amount`;
    const amount = make('input', 'mono');
    amount.id = `${prefix}-amount`;
    amount.type = 'number';
    amount.inputMode = 'decimal';
    amount.min = '0.01';
    amount.max = '100';
    amount.step = '0.01';
    amount.value = '12';
    amount.required = true;
    const hint = make('small', 'wallet-hint', 'Use $0.01 to $100.00 in fictional funds.');
    hint.id = `${prefix}-hint`;
    amount.setAttribute('aria-describedby', `${hint.id} ${prefix}-status`);
    amountGroup.append(amountLabel, amount, hint);

    const actions = make('div', 'wallet-actions');
    const send = make('button', 'btn primary', 'Send demo payment');
    send.type = 'submit';
    const reset = make('button', 'btn', 'Reset sample');
    reset.type = 'button';
    actions.append(send, reset);
    const status = make('p', 'wallet-status', 'All names, funds, and activity here are fictional. Try a sample payment.');
    status.id = `${prefix}-status`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const history = make('div', 'wallet-history');
    const historyHeading = make('h4', '', 'Sample activity');
    historyHeading.id = `${prefix}-history-heading`;
    const activity = make('ol', 'wallet-history-list');
    activity.setAttribute('aria-labelledby', historyHeading.id);
    const empty = make('p', 'wallet-empty', 'Your demo payments will appear here.');
    const footnote = make('small', 'wallet-note', 'Up to 10 sample transactions. This demo resets when you close or reopen the project.');
    history.append(historyHeading, empty, activity, footnote);
    form.append(people, amountGroup, actions, status);
    wallet.append(top, form, history);
    container.replaceChildren(wallet);

    function showStatus(message, isError = false) {
      status.textContent = message;
      status.dataset.state = isError ? 'error' : 'success';
    }

    function renderActivity() {
      balanceValue.textContent = money(balance);
      empty.hidden = transactions.length > 0;
      activity.replaceChildren(...transactions.slice().reverse().map((transaction) => {
        const item = make('li', 'wallet-transaction');
        const label = make('span', '', `Sample payment to ${transaction.recipient}`);
        const value = make('strong', 'mono', money(transaction.cents));
        item.append(label, value);
        return item;
      }));
      send.disabled = transactions.length >= 10;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (transactions.length >= 10) {
        showStatus('You have reached 10 sample transactions. Use Reset sample to try again.', true);
        return;
      }
      const rawAmount = amount.value.trim();
      const numberAmount = Number(rawAmount);
      const cents = Math.round(numberAmount * 100);
      if (!/^(?:\d+|\d*\.\d{1,2})$/.test(rawAmount) || !Number.isFinite(numberAmount) || cents < 1 || cents > 10000) {
        amount.setAttribute('aria-invalid', 'true');
        showStatus('Enter an amount from $0.01 to $100.00, using no more than two decimal places.', true);
        amount.focus();
        return;
      }
      if (cents > balance) {
        amount.setAttribute('aria-invalid', 'true');
        showStatus(`Your sample balance is ${money(balance)}. Choose that amount or less, or reset the sample.`, true);
        amount.focus();
        return;
      }
      const recipient = radios.find((radio) => radio.checked)?.value;
      if (!recipients.includes(recipient)) {
        showStatus('Choose a sample recipient before sending.', true);
        return;
      }
      amount.removeAttribute('aria-invalid');
      balance -= cents;
      transactions.push({recipient, cents});
      renderActivity();
      const limitNote = transactions.length === 10 ? ' You have reached 10 sample transactions. Use Reset sample to start over.' : '';
      showStatus(`Demo complete: ${money(cents)} sent to ${recipient}. Sample balance: ${money(balance)}.${limitNote}`);
    });

    amount.addEventListener('input', () => amount.removeAttribute('aria-invalid'));
    reset.addEventListener('click', () => {
      balance = 12500;
      transactions = [];
      amount.value = '12';
      amount.removeAttribute('aria-invalid');
      radios.forEach((radio, index) => { radio.checked = index === 0; });
      renderActivity();
      showStatus('Sample reset. The balance is $125.00, and the activity list is clear.');
    });
  };
})();
