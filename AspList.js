export default class AspList {
    constructor(_list_selector, {} = {}) {

        //LIST
        this.list = document.querySelector(`${_list_selector}`);
        this.model_base_name = this.list.dataset.modelName;
        this.count = 0;

        //SELECTOR
        this.selector = document.querySelector(`#${this.list.dataset.syncSelector}`);
            
        //TEMPLATE
        this.template = this.list.querySelector(this.listTemplateSelector);
        this.template.setAttribute('hidden', '');
        this.template.querySelectorAll('input').forEach((input) => {
            input.setAttribute('disabled', '');
        });

        //CONTROL    
        this.AddControls.forEach((addNode) => {
            addNode.addEventListener('click', (e) => {
                this.AddClick();
            });
        });

        this.DeleteControls.forEach((delCanNode) => {
            delCanNode.addEventListener('click', (e) => {
                this.DeleteClick();
            });
        });

    } 

    Add(obj) {
        var item_template = this.CloneTemplate(obj);
        this.AddFromTemplateForm(item_template);
    }

    AddFromTemplateForm(item_template) {

        if (this.selector) {
            this.SyncSelector(item_template.querySelector('input[type="text"]').value, 'add');
            this.ReadOnlyInputs(item_template);
        } 

        //JUST ADD TO LIST AS IS, EDIT INLINE
        this.list.appendChild(item_template);
        this.count++;
    }
    ReplaceIndex(str, index) {
        const regex = /[0-9]+/;

        return str.replace(regex, index);
    }

    CloneTemplate(data = {}) {

        var new_item = this.template.cloneNode(true);

        new_item.classList.remove('list-template');
        new_item.classList.add('list-item');

        new_item.removeAttribute('hidden');
        new_item.querySelectorAll('input').forEach((input) => {
            input.removeAttribute('disabled');
        });


        //NAME AND ID ON EACH INPUT
        new_item.querySelectorAll('input').forEach((input) => {
            var base_id = input.id;
            var base_name = input.name;

            if (input.dataset.modelName) {
                input.id = `${input.dataset.modelName}_${this.count}__${base_id}`;
                input.name = `${input.dataset.modelName}[${this.count}].${base_name}`;
            }

            if (input.type === "checkbox") {
                var val = (data[base_name] || "false").toLowerCase() === "true";

                //CHECK BOX IF TRUE
                input.value = 'true'; 
                if (val) {
                    input.checked = "checked";
                }

                //ADDS DUMMY CHECKBOX SO THAT CHECKBOX IS ALWAYS SUBMITTED
                var inv_input = input.cloneNode(true);
                inv_input.value = 'false';
                inv_input.type = 'hidden';
                input.parentNode.appendChild(inv_input);
            } else {
                input.value = data[base_name] || "";
            }

        });
        
        return new_item;
    }

    ReadOnlyInputs(item) {
        item.querySelectorAll('input').forEach((input) => {
            input.setAttribute('readonly', '');
            input.classList.add('form-control-plaintext');
            input.classList.remove('form-control');
        });
    }
    
    SyncSelector(value, addremove) {
        if (this.selector) {
            if (addremove === 'add') {
                var add_opt = document.createElement('option');
                add_opt.innerHTML = value;
                add_opt.value = value;
                var existing = this.selector.querySelectorAll(`option[value='${value}']`);
                if (existing.length === 0) {
                    this.selector.appendChild(add_opt);
                }
            } else if (addremove === 'remove') {
                var remove_opt = this.selector.querySelector(`option[value='${value}']`);
                remove_opt.remove();
            }
        }
    }

    //get Count() {
    //    this.count;
    //}
    //set Count(new_count) {
    //    return this.list.dataset.count = new_count;
    //}
    get ListItems() {
        return this.list.querySelectorAll(`${this.listItemSelector}:not(${this.listTemplateSelector})`);
    }
    get ListMode() {
        return this.list.dataset.mode || 'single';
    }
    get DeleteActive() {
        return (this.list.dataset.deleteActive || "false") === "true";
    }
    get AddControls() {
        return document.querySelectorAll(`${this.addControlSelector}[data-target='${this.list.id}']`);
    }
    get DeleteControls() {
        return document.querySelectorAll(`${this.delControlSelector}[data-target='${this.list.id}']`);
    }

    get listTemplateSelector() { return '.list-template'; }
    get listItemSelector() { return '.list-item'; }
    get addControlSelector() { return '.list-add'; }
    get delControlSelector() { return '.list-delete'; }

    AddClick() {
        var item_template = this.CloneTemplate();

        if (this.selector) {
            //IF SYNCING A SELECTOR FIELD, USE MODAL AND SET READONLY BEFORE INSERT TO LIST
            this.GetInputModal(item_template, { title: this.list.dataset.prompt });
        } else {
            //JUST ADD TO LIST AS IS, EDIT INLINE
            this.AddFromTemplateForm(item_template);
        }
    }

    DeleteClick() {
        if (this.DeleteActive) {
            this.list.dataset.deleteActive = "false";//TOGGLE TO FALSE

            //CONTROLS
            this.DeleteControls.forEach((delNode) => {
                delNode.innerHTML = "Delete"; //CHANGE TEXT TO DELETE
            });

            this.AddControls.forEach((addNode) => {
                addNode.removeAttribute('hidden');//RE-SHOW ADD BUTTON
            });


            //LIST
            this.ListItems.forEach((item) => {
                //item.classList.remove('delete-hover'); //REMOVE DELETE HOVER EFFECT
                //item.querySelector('.list-delete-icon').setAttribute('hidden', ''); //HIDE DELETE ICON

                //CLEAR EVENTS FROM LIST ITEMS
                var new_item = item.cloneNode(true);

                new_item.querySelectorAll('.delete-overlay').forEach((delete_item) => { delete_item.remove(); })

                item.parentNode.replaceChild(new_item, item);



            });

        } else {
            //CONTROLS
            this.list.dataset.deleteActive = "true";//TOGGLE TO TRUE

            //CONTROLS
            this.DeleteControls.forEach((delNode) => {
                delNode.innerHTML = "OK"; //CHANGE TEXT TO DELETE
            });

            this.AddControls.forEach((addNode) => {
                addNode.setAttribute('hidden','');//RE-SHOW ADD BUTTON
            });

            //LIST
            this.ListItems.forEach((item, item_index, item_list) => {

                //item.classList.add('delete-hover'); //ADD HOVER EFFECT
                //item.querySelector('.list-delete-icon').removeAttribute('hidden'); //SHOW DELETE ICON

                //DELETE EVENT
                item.addEventListener('click', (e) => {
                    if (item_list.length > (this.list.dataset.min || 0)) {
                        this.SyncSelector(
                            item.querySelector('input[type="text"]').value,
                            'remove'
                        );

                        item.remove(); //remove from DOM
                        //this.count--; //ALWAYS INCREATE FOR NO OVERLAP
                    } else {
                        //TODO FEED BACK MINIMUM VALUE
                    }
                });
                var overlayDiv = document.createElement('div');
                overlayDiv.style.cssText = `
                        position: absolute; /* Sit on top of the page content */
                        display: fixed; /* Hidden by default */
                        width: 100 %; /* Full width (cover the whole page) */
                        height: 100 %; /* Full height (cover the whole page) */
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(255, 0, 0, 0.5); /* Black background with opacity */
                        color: white;
                        text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
                        text-align: center;
                        z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
                        cursor: pointer; /* Add a pointer on hover */
                    `;
                overlayDiv.innerHTML = "Delete";
                overlayDiv.classList.add('delete-overlay');
                item.appendChild(overlayDiv);

                ////DELETE EVENT
                //item.addEventListener('mouseover', (e) => {
                    
                //});
            });
        }
    }
       
    GetInputModal(input_form, { title = '', cancel_callback = null }) {
        $('#modal-form').remove();

        var div = document.createElement('div');
        div.classList.add('modal');
        div.id = 'modal-form';
        div.setAttribute("tabindex", "-1");
        div.setAttribute("role", "dialog");
        div.setAttribute("aria-labelledby", "modal-form-label");
        div.setAttribute("aria-hidden", "true");

        div.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title" id="modal-form-label">${title}</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div class="modal-body" >
            <form id="input-modal-body">

          <div class="form-group">
            </div>
            </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="modal_ok_button" >OK</button>
              </div>
            </div>
          </div>`;

        document.body.appendChild(div);
        $('#modal-form').modal('show');
        document.querySelector('#input-modal-body').appendChild(input_form);


        var input = input_form.querySelector('input');
        if (null !== input) {
            input.focus();
        }

        var btn = document.querySelector('#modal_ok_button');
        btn.addEventListener('click', () => {
            this.AddFromTemplateForm(input_form);
            $('#modal-form').modal('hide');
            $('#modal-form').modal('dispose');
        });
    };
}