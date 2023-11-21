import Vue from 'vue';
import { ApolloErrorList } from '@/plugins/apollo';

export type Rule = (v: any) => boolean|string;

export interface RulesMetadata {
  name: string;
}

let registeredCounter: number = 0;

export class Form {

  public static readonly ROOT_FIELD = 'ROOT_FIELD';

  private formName: string;
  private component: Vue;
  private _rootSelector: string;
  private metadatas: { [name: string]: RulesMetadata } = {};
  private errors: { [name: string]: string[] } = {};
  private mustForceUpdate: boolean = false;
  private _mainErrorId: string = Form.ROOT_FIELD;

  public constructor(component: Vue, options: { rootSelector?: string } = {}) {
    this.formName = 'reactiveForm' + ++registeredCounter;
    // component.$set(component.$data, this.componentName, true);
    this.component = component;
    this._rootSelector = options.rootSelector;
  }

  // public get reactiveThis(): this {
  //   return this.component[this.componentName];
  // }

  public rules(name: string, rules: Rule[] = []): Rule[] {
    this.metadatas[name] = {
      name: name,
    }
    const errors = this.errors[name] || [];
    return [
      ...rules,
      ...errors.map(error => (v: any) => error)
    ];
  }

  public get rootEl(): HTMLElement {
    return (this._rootSelector ? document.body.querySelector(this._rootSelector) : this.component.$el) as any;
  }

  public get rootErrors(): string [] {
    return this.errors[Form.ROOT_FIELD] || [];
  }

  public get formFields(): any {
    const list = [];
    const search = (component: Vue) => {
      if (!component) {
        return;
      }
      if (
        this.rootEl &&
        (component as any).$el &&
        this.rootEl.contains((component as any).$el) &&
        (component as any).isComponentFormField &&
        Object.keys(this.metadatas).indexOf((component as any).name) !== -1
      ) {
        list.push(component);
      }
      for (const child of component.$children) {
        search(child);
      }
    }
    search(this.component);
    return list;
  }

  public async validate(): Promise<void> {
    await Promise.all(
      this.formFields.map(component => component.validate())
    )
  }

  public get isValid(): boolean {
    return this.formFields.reduce((a, component) => a && (!component || component.isValid), true);
  }

  public get mainErrorId(): string {
    return this._mainErrorId;
  }

  public set mainErrorId(value: string) {
    this._mainErrorId = value;
  }

  public forceUpdate() {

    // This code force reactive refresh for all computed or watch listen form
    for (const name of Object.keys(this.component)) {
      if (this.component[name] instanceof Form && this.component[name].formName === this.formName) {
        // If the component data is proxy return original or return proxy for force refresh
        this.component[name] = this.component[name] === this ? new Proxy(this, {}) : this;
      }
    }

    this.component.$forceUpdate();
  }

  public addError(name: string, error: string): this {
    name = this.metadatas[name] ? name : this._mainErrorId;
    if (!this.errors[name]) {
      this.errors[name] = [];
    }
    this.errors[name].push(error);
    this.forceUpdate();
    return this;
  }

  public addMainError(error: string): this {
    return this.addError(this._mainErrorId, error);
  }

  public clearErrors() {
    this.errors = {};
    this.formFields.forEach(component => component.clearError());
    this.forceUpdate();
    return this;
  }

  public async scrollToError(): Promise<void> {
    await this.component.$nextTick();
    if (this.rootEl) {
      const field = this.rootEl.querySelectorAll('.main-error .SystemMessage, .FormField--hasErrors')[0];
      if (field) {
        this.component.$smoothScroll({
          scrollTo: field,
          duration: 200,
          offset: -80,
        })
      }
    }
  }

  public async call(callback: () => Promise<void>, options: {
    scrollToError?: boolean,
    cbError?: () => void,
    cbFrontError?: (e?: any) => void,
    cbBackError?: (e?: any) => void
  } = {}): Promise<void> {

    options = {
      scrollToError: true,
      ...options
    }

    try {
      this.clearErrors();
      await this.validate();
      if (this.isValid) {
        await callback();
      } else {
        if (options.cbFrontError) { options.cbFrontError(); }
        if (options.cbError) { options.cbError(); }
        if (options.scrollToError) { this.scrollToError(); }
      }
    } catch (e) {
      this.fromError(e);
      if (options.cbBackError) { options.cbBackError(e); }
      if (options.cbError) { options.cbError(); }
      if (options.scrollToError) { this.scrollToError(); }
    }
    this.forceUpdate();
  }

  public fromError(e: any): void {

    console.error(e);

    if (e.apollo) {
      e = e.apollo;
    }

    let bindded = false;

    const displayError = (errors, target) => {

      for (const error of errors) {
        let targetFinale = target;
        if (this.metadatas[error.subject]) {
          targetFinale = error.subject;
        } else {
          for (const name of Object.keys(this.metadatas)) {
            const index = name.lastIndexOf('.');
            if (index !== -1 && name.substr(index + 1) === error.subject) {
              targetFinale = name;
              break;
            }
          }
        }
        this.addError(targetFinale, error.message);
        bindded = true;
      }
    }

    if (Array.isArray(e?.errors)) {
      for (const sub of e.errors) {
        if (!sub.error) {
          continue;
        }
        let target = Form.ROOT_FIELD;
        if (sub.error.path) {
          const path = [ ...sub.error.path ];
          path.shift();
          target = path.join('.')
        }
        if (!this.metadatas[target]) {
          target = Form.ROOT_FIELD;
        }

        if (sub.error?.errors) {
          displayError(sub.error.errors, target);
        }
        if (sub.error?.extensions?.errors) {
          displayError(sub.error.extensions.errors, target);
        }
      }
    }

    if (!bindded) {
      this.addError(Form.ROOT_FIELD, this.component.$t('generic.errors.default_general').toString());
    }
  }
}
