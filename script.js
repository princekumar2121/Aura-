const sys = {
    db: {
        p: JSON.parse(localStorage.getItem('np_p')) || [],
        s: JSON.parse(localStorage.getItem('np_s')) || [],
        c: JSON.parse(localStorage.getItem('np_c')) || []
    },
    cart: [],
    selectedIcon: 'fa-bolt',

    boot: () => {
        document.getElementById('boot-sequence').style.transform = 'translateY(-100%)';
        setTimeout(() => { 
            document.getElementById('boot-sequence').classList.add('hidden'); 
            document.getElementById('scr-auth').classList.remove('hidden'); 
        }, 600);
    },

    selIcon: (el, icon) => {
        document.querySelectorAll('.icon-opt').forEach(opt => opt.classList.remove('selected'));
        el.classList.add('selected'); 
        sys.selectedIcon = icon;
    },

    launch: () => {
        const shop = document.getElementById('f-shop').value || "AURA_NODE";
        const mail = document.getElementById('f-mail').value || "ADMIN@AURA";
        document.getElementById('disp-shop').innerText = shop;
        document.getElementById('disp-mail').innerText = mail;
        document.getElementById('active-icon').className = 'fa ' + sys.selectedIcon;
        document.getElementById('scr-auth').classList.add('hidden');
        document.getElementById('app-wrap').style.display = 'flex';
        sys.to('home');
    },

    to: (id, el) => {
        document.querySelectorAll('main > div').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.nav-node').forEach(n => n.classList.remove('active'));
        document.getElementById('pg-' + id).classList.remove('hidden');
        if(el) el.classList.add('active');
        if(id === 'home') sys.updateStats();
        if(id === 'inv') sys.renderP();
        if(id === 'bill') sys.renderPOS();
        if(id === 'cust') sys.renderC();
        if(id === 'debt') sys.renderD();
    },

    saveP: () => {
        const p = { 
            name: document.getElementById('f-pname').value, 
            brand: document.getElementById('f-pbrand').value, 
            price: Number(document.getElementById('f-pprice').value), 
            stock: Number(document.getElementById('f-pstock').value) 
        };
        const id = document.getElementById('f-pid').value;
        if(id !== "") sys.db.p[id] = p; else sys.db.p.push(p);
        localStorage.setItem('np_p', JSON.stringify(sys.db.p));
        sys.closeM(); sys.renderP();
    },

    renderP: () => {
        document.getElementById('list-p').innerHTML = sys.db.p.map((p, i) => `
            <tr>
                <td><b>${p.name}</b></td>
                <td>${p.brand}</td>
                <td>₹${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick="sys.editP(${i})" style="color:var(--cyan); background:none; border:none; cursor:pointer"><i class="fa fa-edit"></i></button>
                    <button onclick="sys.delP(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer; margin-left:10px"><i class="fa fa-trash"></i></button>
                </td>
            </tr>`).join('');
    },

    editP: (i) => {
        const p = sys.db.p[i];
        document.getElementById('f-pname').value = p.name; 
        document.getElementById('f-pbrand').value = p.brand; 
        document.getElementById('f-pprice').value = p.price; 
        document.getElementById('f-pstock').value = p.stock; 
        document.getElementById('f-pid').value = i;
        sys.openM();
    },

    delP: (i) => { if(confirm("ABORT NODE?")) { sys.db.p.splice(i, 1); localStorage.setItem('np_p', JSON.stringify(sys.db.p)); sys.renderP(); } },

    renderPOS: () => {
        const q = document.getElementById('p-search').value.toLowerCase();
        const filter = sys.db.p.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
        document.getElementById('pos-grid').innerHTML = filter.map(p => `
            <div class="p-node" onclick="sys.addCart('${p.name}')">
                <small style="color:var(--cyan)">${p.brand}</small>
                <div style="font-weight:900; font-size:14px; margin:5px 0;">${p.name}</div>
                <b>₹${p.price}</b>
            </div>`).join('');
    },

    addCart: (name) => {
        const p = sys.db.p.find(x => x.name === name);
        if(p.stock <= 0) return alert("RESOURCE DEPLETED");
        sys.cart.push({...p});
        sys.renderCart();
    },

    renderCart: () => {
        let t = 0;
        document.getElementById('cart-list').innerHTML = sys.cart.map((i, idx) => { 
            t += i.price; 
            return `<div style="display:flex; justify-content:space-between; margin-bottom:8px">
                        <span>${i.name}</span>
                        <b>₹${i.price} <i class="fa fa-times-circle" onclick="sys.remCart(${idx})" style="color:var(--danger); cursor:pointer; margin-left:5px"></i></b>
                    </div>`; 
        }).join('');
        document.getElementById('cart-total').innerText = '₹' + t;
    },

    remCart: (idx) => { sys.cart.splice(idx, 1); sys.renderCart(); },

    checkout: (status) => {
        if(!sys.cart.length) return alert("CART EMPTY");
        const name = document.getElementById('b-name').value || 'CITIZEN_X';
        const phone = document.getElementById('b-phone').value || 'N/A';
        const addr = document.getElementById('b-addr').value || 'GEO_N/A';
        const total = Number(document.getElementById('cart-total').innerText.replace('₹',''));
        const sale = { name, phone, addr, total, status, time: new Date().toLocaleString(), items: [...sys.cart] };
        
        sys.db.s.push(sale);
        sys.cart.forEach(c => { 
            const original = sys.db.p.find(p => p.name === c.name);
            if(original) original.stock--; 
        });
        if(!sys.db.c.find(x => x.phone === phone)) sys.db.c.push({name, phone, addr});
        
        localStorage.setItem('np_p', JSON.stringify(sys.db.p));
        localStorage.setItem('np_s', JSON.stringify(sys.db.s));
        localStorage.setItem('np_c', JSON.stringify(sys.db.c));

        if(status === 'Paid') sys.printBill(sale);
        sys.cart = []; 
        sys.to('home');
        document.getElementById('b-name').value = ''; 
        document.getElementById('b-phone').value = ''; 
        document.getElementById('b-addr').value = '';
    },

    printBill: (s) => {
        const zone = document.getElementById('receipt-render');
        const shop = document.getElementById('disp-shop').innerText;
        zone.innerHTML = `
            <center>
                <h2 style="margin:0">${shop}</h2>
                <p style="margin:5px 0">ID: ${Date.now()}</p>
            </center>
            <hr>
            <p>DATE: ${s.time}<br>CLIENT: ${s.name}<br>PHONE: ${s.phone}</p>
            <hr>
            <table style="width:100%; border:none; color:black">
                ${s.items.map(i => `<tr><td>${i.name}</td><td align="right">₹${i.price}</td></tr>`).join('')}
            </table>
            <hr>
            <h3 style="display:flex; justify-content:space-between"><span>TOTAL</span><span>₹${s.total}</span></h3>
            <center><p style="font-size:10px">NEURAL SYNC SUCCESSFUL<br>AURA_OS PRINT ENGINE</p></center>
        `;
        window.print();
    },

    updateStats: () => {
        const r = sys.db.s.filter(s => s.status === 'Paid').reduce((a,b)=>a+b.total, 0);
        const d = sys.db.s.filter(s => s.status === 'Unpaid').reduce((a,b)=>a+b.total, 0);
        document.getElementById('st-rev').innerText = r;
        document.getElementById('st-debt').innerText = d;
        document.getElementById('st-cust').innerText = sys.db.c.length;
    },

    renderC: () => {
        document.getElementById('list-c').innerHTML = sys.db.c.map(c => `<tr><td><b>${c.name}</b></td><td>${c.phone}</td><td>${c.addr}</td><td style="color:var(--success)">VERIFIED</td></tr>`).join('');
    },

    renderD: () => {
        const unpaid = sys.db.s.filter(s => s.status === 'Unpaid');
        document.getElementById('list-d').innerHTML = unpaid.map((s, i) => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone}</td>
                <td style="color:var(--danger)">₹${s.total}</td>
                <td>${s.time}</td>
                <td><button class="btn-cyber" style="padding:5px 10px; font-size:10px; width:auto" onclick="sys.clearD(${sys.db.s.indexOf(s)})">MARK PAID</button></td>
            </tr>`).join('');
    },

    clearD: (idx) => { 
        sys.db.s[idx].status = 'Paid'; 
        localStorage.setItem('np_s', JSON.stringify(sys.db.s)); 
        sys.renderD(); 
    },
    openM: () => document.getElementById('modal-p').classList.remove('hidden'),
    closeM: () => { 
        document.getElementById('modal-p').classList.add('hidden'); 
        document.getElementById('f-pid').value = ""; 
        document.querySelectorAll('#modal-p input').forEach(i => i.value = ""); 
    }
};
