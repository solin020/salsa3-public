import { M as defineComponent, aM as ref, bZ as DefaultService, aR as resolveComponent, aE as openBlock, s as createBlock, bx as withCtx, I as createVNode, H as createTextVNode, b3 as toDisplayString, bY as _sfc_main$1, bE as _sfc_main$2, bG as _sfc_main$3, u as createElementBlock, aP as renderList, v as createBaseVNode, F as Fragment, bc as unref, bF as id_regex_test, b_ as _sfc_main$4, b$ as createVuetify, r as createApp, c0 as index, c1 as components, c2 as directives } from "./style-DzN2oKII.js";
const _hoisted_1 = /* @__PURE__ */ createBaseVNode("h2", null, "Admins::", -1);
const _hoisted_2 = /* @__PURE__ */ createBaseVNode("br", null, null, -1);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AdminApp",
  setup(__props) {
    const admins = ref([]);
    const coordinators = ref([]);
    const projects = ref([]);
    const new_admin = ref("");
    const new_coordinator_id = ref("");
    const new_coordinator_project = ref("");
    const existing_coordinator_project = ref("");
    const admin_ok = ref(false);
    const passwordEntry = ref(null);
    const updatePassword = ref(null);
    async function change_password() {
      const updateInfo = await updatePassword.value.update_password();
      if (updateInfo) {
        fetch("/salsa/server/update-admin-password?" + new URLSearchParams({
          "id": email.value,
          "old_password": updateInfo.oldPassword,
          "new_password": updateInfo.newPassword
        }), { method: "POST" }).then((res) => {
          if (!res.ok) {
            throw new Error(``);
          }
          alert("Please reload webpage to login with new password.");
        }).catch(() => alert("password update failed."));
      }
    }
    function outer_admin_regex_text(s) {
      const retval = id_regex_test(s);
      if (retval === true) {
        admin_ok.value = true;
      } else {
        admin_ok.value = false;
      }
      return retval;
    }
    const coordinator_ok = ref(false);
    function outer_coordinator_regex_text(s) {
      const retval = id_regex_test(s);
      if (retval === true) {
        coordinator_ok.value = true;
      } else {
        coordinator_ok.value = false;
      }
      return retval;
    }
    const new_tts_url = ref("");
    const new_stt_url = ref("");
    const new_ollama_url = ref("");
    const new_public_url = ref("");
    const new_wss_url = ref("");
    const new_llm_model = ref("");
    const new_api_key = ref("");
    const new_tts_type = ref("self-hosted");
    const new_stt_type = ref("self-hosted");
    const new_llm_type = ref("ollama");
    const new_stt_model = ref("");
    const new_tts_model = ref("");
    const new_gpg_key_name = ref("");
    const new_gpg_passphrase = ref("");
    async function reload_config() {
      const config_params = await await fetch("/salsa/server/admin/get-config").then((r) => r.json());
      new_tts_url.value = config_params.tts_url;
      new_stt_url.value = config_params.stt_url;
      new_ollama_url.value = config_params.ollama_url;
      new_public_url.value = config_params.public_url;
      new_wss_url.value = config_params.wss_url;
      new_llm_model.value = config_params.llm_model;
      new_api_key.value = config_params.api_key;
      new_llm_type.value = config_params.llm_type;
      new_stt_type.value = config_params.stt_type;
      new_tts_type.value = config_params.tts_type;
      new_stt_model.value = config_params.stt_model;
      new_tts_model.value = config_params.tts_model;
      new_gpg_key_name.value = config_params.gpg_key_name;
      new_gpg_passphrase.value = config_params.gpg_passphrase;
    }
    reload_config();
    async function set_config(arg0) {
      const retval = await fetch("/salsa/server/admin/set-config?" + new URLSearchParams({ ...arg0 }), { method: "POST" });
      await reload_config();
      return retval;
    }
    const email = ref("");
    DefaultService.getYourEmailSalsaServerApiGetYourEmailGet().then(
      (r) => email.value = r
    );
    function reload_projects() {
      DefaultService.adminGetProjectsSalsaServerApiAdminGetProjectsGet().then(
        (r) => projects.value = Array.from(new Set(r))
      );
    }
    reload_projects();
    function reload_admins() {
      DefaultService.getAdminsSalsaServerApiGetAdminsGet().then(
        (r) => admins.value = r.map((id) => ({ id }))
      );
    }
    reload_admins();
    async function add_admin() {
      const password = await passwordEntry.value.get_password();
      if (password) {
        const response = fetch(
          "/salsa/server/api/add-admin?" + new URLSearchParams({ id: new_admin.value, password }),
          { method: "POST" }
        );
        response.then(() => reload_admins()).catch((r) => {
          alert(r);
        });
      }
    }
    function delete_admin(arg0) {
      if (!window.confirm(`Are you sure you want to delete ${arg0.admin}?`)) {
        throw "Delete admin cancelled.";
      }
      const response = fetch(
        "/salsa/server/api/delete-admin?" + new URLSearchParams({ id: arg0.admin }),
        { method: "DELETE" }
      );
      response.then(() => reload_admins());
      return response;
    }
    async function change_coordinator_password(arg0) {
      const password = await passwordEntry.value.get_password();
      if (password) {
        const response = fetch(
          "/salsa/server/admin-change-coordinator-password?" + new URLSearchParams({ id: arg0.id, password }),
          { method: "POST" }
        );
        return response;
      } else {
        throw "Change coordinator password cancelled.";
      }
    }
    function delete_coordinator(arg0) {
      if (!window.confirm(`Are you sure you want to delete ${arg0.id}?`)) {
        throw "Delete coordinator cancelled.";
      }
      const response = fetch(
        "/salsa/server/api/delete-coordinator?" + new URLSearchParams({ id: arg0.id }),
        { method: "DELETE" }
      );
      response.then(() => reload_admins());
      return response;
    }
    async function add_existing_coordinator(arg0) {
      return fetch("/salsa/server/add-coordinator-project?" + new URLSearchParams({
        id: arg0.id,
        project: existing_coordinator_project.value
      }), { method: "POST" });
    }
    function reload_coordinators() {
      DefaultService.getCoordinatorsSalsaServerApiGetCoordinatorsGet().then(
        (r) => coordinators.value = r
      );
    }
    reload_coordinators();
    async function add_coordinator(arg0) {
      const password = await passwordEntry.value.get_password();
      if (!password) {
        throw "Add coordinator cancelled.";
      }
      const response = fetch(
        "/salsa/server/add-coordinator?" + new URLSearchParams({
          id: new_coordinator_id.value,
          project: new_coordinator_project.value,
          password
        }),
        { method: "POST" }
      );
      response.then(
        () => reload_coordinators()
      );
      return response;
    }
    function delete_coordinator_project(arg0) {
      if (!window.confirm(`Are you sure you want to remove ${arg0.project} from ${arg0.id}?`)) {
        throw "Delete coordinator from project cancelled.";
      }
      const response = fetch(
        "/salsa/server/delete-coordinator-project?" + new URLSearchParams({ ...arg0 }),
        { method: "DELETE" }
      );
      response.then(
        () => reload_coordinators()
      );
      return response;
    }
    return (_ctx, _cache) => {
      const _component_v_app_bar_title = resolveComponent("v-app-bar-title");
      const _component_v_btn = resolveComponent("v-btn");
      const _component_v_app_bar = resolveComponent("v-app-bar");
      const _component_v_card_title = resolveComponent("v-card-title");
      const _component_v_card_actions = resolveComponent("v-card-actions");
      const _component_v_card = resolveComponent("v-card");
      const _component_v_text_field = resolveComponent("v-text-field");
      const _component_v_card_text = resolveComponent("v-card-text");
      const _component_v_combobox = resolveComponent("v-combobox");
      const _component_v_list_item = resolveComponent("v-list-item");
      const _component_v_select = resolveComponent("v-select");
      const _component_v_list = resolveComponent("v-list");
      const _component_v_main = resolveComponent("v-main");
      const _component_v_app = resolveComponent("v-app");
      return openBlock(), createBlock(_component_v_app, null, {
        default: withCtx(() => [
          createVNode(_component_v_app_bar, { style: { "background-image": "var(--salsablue)", "color": "white", "background-repeat": "no-repeat", "filter": "none", "text-shadow": "0 -1px 0 rgba(0,0,0,0.3)" } }, {
            default: withCtx(() => [
              createVNode(_component_v_app_bar_title, null, {
                default: withCtx(() => [
                  createTextVNode("Salsa 2 Adminstrator interface for " + toDisplayString(email.value), 1)
                ]),
                _: 1
              }),
              createVNode(_component_v_btn, {
                onClick: change_password,
                style: { "color": "black", "background-color": "white" }
              }, {
                default: withCtx(() => [
                  createTextVNode("Change your password")
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          createVNode(_component_v_main, null, {
            default: withCtx(() => [
              createVNode(_sfc_main$1, { tabnames: ["admins", "coordinators", "config"] }, {
                header_admins: withCtx(() => [
                  createTextVNode(" View admins ")
                ]),
                content_admins: withCtx(() => [
                  createVNode(_sfc_main$2, {
                    items: admins.value,
                    fixed_order: true,
                    uneditable: true
                  }, {
                    preamble: withCtx(() => [
                      _hoisted_1
                    ]),
                    renderer: withCtx(({ item: admin }) => [
                      createVNode(_component_v_card, null, {
                        default: withCtx(() => [
                          createVNode(_component_v_card_title, null, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(admin.id), 1)
                            ]),
                            _: 2
                          }, 1024),
                          createVNode(_component_v_card_actions, null, {
                            default: withCtx(() => [
                              createVNode(_sfc_main$3, {
                                click: delete_admin,
                                arg0: { admin: admin.id }
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("Revoke admin privileges from " + toDisplayString(admin.id), 1)
                                ]),
                                _: 2
                              }, 1032, ["arg0"])
                            ]),
                            _: 2
                          }, 1024)
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    postamble: withCtx(() => [
                      createVNode(_component_v_card, null, {
                        default: withCtx(() => [
                          createVNode(_component_v_card_title, null, {
                            default: withCtx(() => [
                              createTextVNode("Add a new admin")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_v_card_text, null, {
                            default: withCtx(() => [
                              createVNode(_component_v_text_field, {
                                rules: [outer_admin_regex_text],
                                modelValue: new_admin.value,
                                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => new_admin.value = $event),
                                label: "admin email"
                              }, null, 8, ["rules", "modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_v_card_actions, null, {
                            default: withCtx(() => [
                              createVNode(_component_v_btn, {
                                onClick: add_admin,
                                arg0: void 0,
                                disabled: !admin_ok.value
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("Add admin")
                                ]),
                                _: 1
                              }, 8, ["disabled"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["items"])
                ]),
                header_coordinators: withCtx(() => [
                  createTextVNode(" View coordinators ")
                ]),
                content_coordinators: withCtx(() => [
                  createVNode(_sfc_main$2, {
                    items: coordinators.value,
                    fixed_order: true,
                    uneditable: true
                  }, {
                    preamble: withCtx(() => [
                      createTextVNode(" View Existing Coordinators (click to edit): ")
                    ]),
                    renderer: withCtx(({ item: coordinator }) => [
                      createVNode(_component_v_card, null, {
                        default: withCtx(() => [
                          createVNode(_component_v_card_title, null, {
                            default: withCtx(() => [
                              createTextVNode("Coordinator Project Assignments")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_v_card_text, null, {
                            default: withCtx(() => [
                              createVNode(_component_v_card, {
                                color: "indigo",
                                variant: "outlined"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_v_card_title, null, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(coordinator.id) + "'s existing projects ", 1)
                                    ]),
                                    _: 2
                                  }, 1024),
                                  createVNode(_component_v_card_actions, null, {
                                    default: withCtx(() => [
                                      (openBlock(true), createElementBlock(Fragment, null, renderList(coordinator.projects, (project) => {
                                        return openBlock(), createBlock(_sfc_main$3, {
                                          click: delete_coordinator_project,
                                          arg0: { id: coordinator.id, project }
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(" Remove "),
                                            createBaseVNode("code", null, toDisplayString(coordinator.id), 1),
                                            createTextVNode(" from project " + toDisplayString(project), 1)
                                          ]),
                                          _: 2
                                        }, 1032, ["arg0"]);
                                      }), 256)),
                                      createVNode(_sfc_main$3, {
                                        click: change_coordinator_password,
                                        arg0: { id: coordinator.id }
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" Change password for "),
                                          createBaseVNode("code", null, toDisplayString(coordinator.id), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["arg0"]),
                                      createVNode(_sfc_main$3, {
                                        click: delete_coordinator,
                                        arg0: { id: coordinator.id }
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" Delete coordinator "),
                                          createBaseVNode("code", null, toDisplayString(coordinator.id), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["arg0"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024),
                              createVNode(_component_v_card, {
                                color: "indigo",
                                variant: "outlined"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_v_card_title, null, {
                                    default: withCtx(() => [
                                      createTextVNode("Add "),
                                      createBaseVNode("code", null, toDisplayString(coordinator.id), 1),
                                      createTextVNode(" to another project")
                                    ]),
                                    _: 2
                                  }, 1024),
                                  createVNode(_component_v_card_text, null, {
                                    default: withCtx(() => [
                                      createVNode(_component_v_combobox, {
                                        items: projects.value,
                                        label: "New project name",
                                        rules: [unref(id_regex_test)],
                                        modelValue: existing_coordinator_project.value,
                                        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => existing_coordinator_project.value = $event)
                                      }, null, 8, ["items", "rules", "modelValue"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_v_card_actions, null, {
                                    default: withCtx(() => [
                                      createVNode(_sfc_main$3, {
                                        click: add_existing_coordinator,
                                        arg0: { id: coordinator.id }
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode("Add "),
                                          createBaseVNode("code", null, toDisplayString(coordinator.id), 1),
                                          createTextVNode(" to project: "),
                                          createBaseVNode("code", null, toDisplayString(existing_coordinator_project.value), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["arg0"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1024)
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    postamble: withCtx(() => [
                      createVNode(_component_v_card, null, {
                        default: withCtx(() => [
                          createVNode(_component_v_card_title, null, {
                            default: withCtx(() => [
                              createTextVNode("Add a new coordinator")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_v_card_text, null, {
                            default: withCtx(() => [
                              createVNode(_component_v_text_field, {
                                rules: [outer_coordinator_regex_text],
                                label: "New Coordinator email",
                                modelValue: new_coordinator_id.value,
                                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => new_coordinator_id.value = $event)
                              }, null, 8, ["rules", "modelValue"]),
                              _hoisted_2,
                              createVNode(_component_v_combobox, {
                                items: projects.value,
                                label: "New coordinator's project",
                                modelValue: new_coordinator_project.value,
                                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => new_coordinator_project.value = $event)
                              }, null, 8, ["items", "modelValue"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_v_card_actions, null, {
                            default: withCtx(() => [
                              createVNode(_sfc_main$3, {
                                click: add_coordinator,
                                disabled: !coordinator_ok.value,
                                arg0: {}
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("Add new coordinator to project: " + toDisplayString(new_coordinator_project.value), 1)
                                ]),
                                _: 1
                              }, 8, ["disabled"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["items"])
                ]),
                header_config: withCtx(() => [
                  createTextVNode(" Update configuration ")
                ]),
                content_config: withCtx(() => [
                  createVNode(_component_v_card, null, {
                    default: withCtx(() => [
                      createVNode(_component_v_card_title, null, {
                        default: withCtx(() => [
                          createTextVNode("Config parameters")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_v_card_text, null, {
                        default: withCtx(() => [
                          createVNode(_component_v_list, null, {
                            default: withCtx(() => [
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_tts_url.value,
                                    "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => new_tts_url.value = $event),
                                    label: "Text to Speech URL"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "tts_url", varval: new_tts_url.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Text to Speech URL")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_select, {
                                    modelValue: new_tts_type.value,
                                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => new_tts_type.value = $event),
                                    items: ["self-hosted", "openai"],
                                    label: "TTS type"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "tts_type", varval: new_tts_type.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Text to Speech type")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_tts_model.value,
                                    "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => new_tts_model.value = $event),
                                    label: "TTS model name"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "tts_model", varval: new_tts_model.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Text to Speech model name")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_stt_url.value,
                                    "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => new_stt_url.value = $event),
                                    label: "Speech to Text URL"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "stt_url", varval: new_stt_url.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Speech to Text URL")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_select, {
                                    modelValue: new_stt_type.value,
                                    "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => new_stt_type.value = $event),
                                    items: ["self-hosted", "openai"],
                                    label: "STT type"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "stt_type", varval: new_stt_type.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Speech to Text type")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_stt_model.value,
                                    "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => new_stt_model.value = $event),
                                    label: "STT model name"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "stt_model", varval: new_stt_model.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Speech to Text model name")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_public_url.value,
                                    "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => new_public_url.value = $event),
                                    label: "Website URL"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "public_url", varval: new_public_url.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Website URL")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_wss_url.value,
                                    "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => new_wss_url.value = $event),
                                    label: "Websocket URL"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "wss_url", varval: new_wss_url.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Websocket URL")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_ollama_url.value,
                                    "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => new_ollama_url.value = $event),
                                    label: "Ollama Instance URL"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "ollama_url", varval: new_ollama_url.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Ollama Instance URL")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_select, {
                                    modelValue: new_llm_type.value,
                                    "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => new_llm_type.value = $event),
                                    items: ["ollama", "openai"],
                                    label: "LLM type"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "llm_type", varval: new_llm_type.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change LLM type")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_llm_model.value,
                                    "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => new_llm_model.value = $event),
                                    label: "LLM Model Name"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "llm_model", varval: new_llm_model.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change LLM Model Name")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_gpg_key_name.value,
                                    "onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => new_gpg_key_name.value = $event),
                                    label: "GPG key name"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "gpg_key_name", varval: new_gpg_key_name.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change GPG key name")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_gpg_passphrase.value,
                                    "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => new_gpg_passphrase.value = $event),
                                    label: "GPG key passphrase"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "gpg_passphrase", varval: new_gpg_passphrase.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change GPG key passphrase")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_v_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_v_text_field, {
                                    modelValue: new_api_key.value,
                                    "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => new_api_key.value = $event),
                                    label: "Openai key"
                                  }, null, 8, ["modelValue"]),
                                  createVNode(_sfc_main$3, {
                                    click: set_config,
                                    arg0: { varname: "api_key", varval: new_api_key.value }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("Change Openai key")
                                    ]),
                                    _: 1
                                  }, 8, ["arg0"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }),
              createVNode(_sfc_main$4, {
                mode: "new",
                ref_key: "passwordEntry",
                ref: passwordEntry
              }, null, 512),
              createVNode(_sfc_main$4, {
                mode: "update",
                ref_key: "updatePassword",
                ref: updatePassword
              }, null, 512)
            ]),
            _: 1
          })
        ]),
        _: 1
      });
    };
  }
});
const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    VBtn: {
      color: "primary",
      variant: "outlined",
      rounded: true
    }
  }
});
createApp(_sfc_main).use(vuetify).use(index, {}).mount("#app");
