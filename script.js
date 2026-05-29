
    // Simple Kanban with Drag & Drop + LocalStorage
    (function(){
      const selectors = {
        todoList: document.getElementById('todo-list'),
        inprogressList: document.getElementById('inprogress-list'),
        doneList: document.getElementById('done-list'),
        modal: document.getElementById('modal'),
        openAdd: document.getElementById('openAdd'),
        save: document.getElementById('save'),
        cancel: document.getElementById('cancel'),
        title: document.getElementById('title'),
        desc: document.getElementById('desc'),
        status: document.getElementById('status'),
        priority: document.getElementById('priority'),
        search: document.getElementById('search'),
        clear: document.getElementById('clear'),
        exportBtn: document.getElementById('export'),
        importBtn: document.getElementById('importBtn'),
        importFile: document.getElementById('importFile')
      };

      let tasks = load() || sampleTasks();
      let editingId = null;
      let dragged = null;

      function sampleTasks(){
        return [
          {id:id(),title:'Prepare project slides',desc:'Finalize slides and demo script',status:'todo',priority:'high',created:Date.now()},
          {id:id(),title:'Implement drag & drop',desc:'Polish animations',status:'inprogress',priority:'low',created:Date.now()},
          {id:id(),title:'Run mock demo',desc:'Practice presentation flow',status:'done',priority:'low',created:Date.now()}
        ];
      }

      function id(){return 't_'+Math.random().toString(36).slice(2,9)}

      function saveToStorage(){localStorage.setItem('kanban.tasks',JSON.stringify(tasks))}
      function load(){try{return JSON.parse(localStorage.getItem('kanban.tasks')||'null')}catch(e){return null}}

      function render(){
        [selectors.todoList,selectors.inprogressList,selectors.doneList].forEach(el=>el.innerHTML='');
        const q = (selectors.search.value||'').toLowerCase();
        tasks.filter(t=>t.title.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q)).forEach(t=>{
          const card = document.createElement('div');
          card.className='card';
          card.draggable=true;
          card.dataset.id=t.id;
          card.innerHTML = `
            <div class="title">${escapeHtml(t.title)}</div>
            <div class="meta">
              <div class="badge ${t.priority==='high'?'pri-high':'pri-low'}">${t.priority.toUpperCase()}</div>
              <div>${new Date(t.created).toLocaleDateString()}</div>
            </div>
            <div style="margin-top:8px;color:var(--muted);font-size:13px">${escapeHtml(t.desc)}</div>
          `;

          // events
          card.addEventListener('dblclick',()=>openEdit(t.id));
          card.addEventListener('contextmenu',e=>{e.preventDefault(); if(confirm('Delete this task?')){deleteTask(t.id)}});

          card.addEventListener('dragstart', (e)=>{
            dragged = card;
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', t.id);
            setTimeout(()=>card.style.display='none',0);
          });
          card.addEventListener('dragend', ()=>{dragged=null; card.classList.remove('dragging'); card.style.display='';});

          if(t.status==='todo') selectors.todoList.appendChild(card);
          if(t.status==='inprogress') selectors.inprogressList.appendChild(card);
          if(t.status==='done') selectors.doneList.appendChild(card);
        });

        document.getElementById('count-todo').textContent = tasks.filter(t=>t.status==='todo').length;
        document.getElementById('count-inprogress').textContent = tasks.filter(t=>t.status==='inprogress').length;
        document.getElementById('count-done').textContent = tasks.filter(t=>t.status==='done').length;
        saveToStorage();
      }

      function escapeHtml(str){return String(str).replace(/[&<>"]+/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]||s));}

      // drag & drop for columns
      document.querySelectorAll('.column').forEach(col=>{
        col.addEventListener('dragover', e=>{e.preventDefault(); col.classList.add('over')});
        col.addEventListener('dragleave', e=>{col.classList.remove('over')});
        col.addEventListener('drop', e=>{
          e.preventDefault(); col.classList.remove('over');
          const idd = e.dataTransfer.getData('text/plain');
          const t = tasks.find(x=>x.id===idd);
          if(t){
            const status = col.dataset.status;
            t.status = status;
            render();
          }
        });
      });

      // CRUD operations
      function openModal(){selectors.modal.style.display='flex';selectors.title.focus();}
      function closeModal(){selectors.modal.style.display='none';editingId=null;selectors.title.value='';selectors.desc.value='';selectors.status.value='todo';selectors.priority.value='low';document.getElementById('modal-title').textContent='Add Task'}
      function openEdit(id){const t = tasks.find(x=>x.id===id); if(!t) return; editingId=id; selectors.title.value = t.title; selectors.desc.value = t.desc; selectors.status.value = t.status; selectors.priority.value = t.priority;document.getElementById('modal-title').textContent='Edit Task'; openModal();}

      function saveTask(){const title = selectors.title.value.trim(); if(!title){alert('Title required');selectors.title.focus();return}
        const payload = {title,desc:selectors.desc.value.trim(),status:selectors.status.value,priority:selectors.priority.value,created: Date.now()};
        if(editingId){const t = tasks.find(x=>x.id===editingId); if(t){Object.assign(t,payload);t.id=editingId}}else{payload.id=id();tasks.unshift(payload)}
        closeModal();render();
      }

      function deleteTask(id){tasks = tasks.filter(x=>x.id!==id);render();}

      // Clear all
      selectors.clear.addEventListener('click',()=>{if(confirm('Clear all tasks?')){tasks=[];render()}});

      // Open modal
      selectors.openAdd.addEventListener('click',()=>{openModal();});
      selectors.cancel.addEventListener('click',()=>closeModal());
      selectors.save.addEventListener('click',saveTask);

      // search
      selectors.search.addEventListener('input',render);

      // export / import
      selectors.exportBtn.addEventListener('click',()=>{
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr],{type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download = 'kanban-tasks.json'; document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      });

      selectors.importBtn.addEventListener('click',()=>selectors.importFile.click());
      selectors.importFile.addEventListener('change', (e)=>{
        const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = (ev)=>{try{const json = JSON.parse(ev.target.result); if(Array.isArray(json)){tasks = json; render(); alert('Imported tasks');}else alert('Invalid file');}catch(err){alert('Invalid JSON file')}}; reader.readAsText(f);
      });

      // initial render
      render();

      // accessibility: close modal on backdrop click
      selectors.modal.addEventListener('click', (e)=>{ if(e.target===selectors.modal) closeModal(); });

      // keyboard: Esc to close modal
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); if(e.key==='n' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); openModal(); } });

    })();
  