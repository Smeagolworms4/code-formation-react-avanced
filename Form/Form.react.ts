import { IForm, IFormField } from '@whisky/styleguide/src/models';
import { FormEvent } from 'react';
import { GQLResultError } from '@/libs/apollo';
import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';

export type StateType<T> = [T, (v: T) => void ];

export class Form implements IForm {

	public static readonly ROOT_FIELD = 'ROOT_FIELD';

	public allToMainError: boolean = false;

	public constructor(
		private _stateIsValid: StateType<boolean>,
		private _stateNoError: StateType<boolean>,
		private _stateLoading: StateType<boolean>,
		private _stateErrors: StateType<Record<string, string[]>>,
		private _staticFieldsData: Record<string, any>,
		private _genericErrorLabel: string,
		private _mainErrorField: string,
		public handle: (event: FormEvent) => any,
		private _valid: boolean,
		private _maxErrorByField: Nullable<number>,
	) {
	}

	public get loading(): boolean {
		return this._stateLoading[0];
	}

	public set loading(value: boolean) {
		this._stateLoading[1](value);
	}

	public get mainRulesErrors(): string[] {
		const errors = [];
		if (this.allToMainError) {
			for (const [ name, data ] of Object.entries(this._staticFieldsData)) {
				const fieldErrors = this._stateErrors[0][name] || [];
				const rules = [
					...(data.rules || []),
					...(fieldErrors.map(error => () => error))
				];
				for (const rule of rules) {
					const error = rule(data.value);
					if (typeof error === 'string') {
						errors.push(error);
					}
				}
			}
		}
		return this._maxErrorByField ? errors.slice(0, this._maxErrorByField) : errors;
	}

	public get rootFieldErrors(): string[] {
		return [
			...(this._stateErrors[0][Form.ROOT_FIELD] || []),
			...this.mainRulesErrors
		];
	}

	public rootElement: Nullable<HTMLFormElement> = null;

	public get fields(): Record<string, IFormField> {
		const fields: Record<string, IFormField> = {};

		for (const [ name, data ] of Object.entries(this._staticFieldsData)) {
			const errors = this._stateErrors[0][name] || [];
			const rules = !this.allToMainError ? [
				...(data.rules || []),
				...(errors.map(error => () => error))
			] : [];

			fields[name] = {
				...data,
				...(data.onChange ? {
					onChange: (...args: any) => {
						data.onChange(...args);
						this.updateState();
					}
				} : {}),
				rules,
			};
		}

		return fields;
	}

	public get formFields(): HTMLElement[] {
		if (this.rootElement) {
			return [
				...(this.rootElement.querySelectorAll('.sg-FormField') as any)
			];
		}
		return [];
	}

	public clearErrors(): this {
		this._stateErrors[1]({});
		this._stateErrors[0] = {};
		return this;
	}

	public markTouched(): this {
		this.formFields.forEach((el: any) => {
			if (el.sgFormMarkTouched) {
				el.sgFormMarkTouched();
			}
		});
		return this;
	}

	public markUntouched(): this {
		this.formFields.forEach((el: any) => {
			if (el.sgFormMarkUntouched) {
				el.sgFormMarkUntouched();
			}
		});
		return this;
	}

	public clear(): this {
		this.formFields.forEach((el: any) => {
			if (el.sgFormMarkClear) {
				el.sgFormMarkClear();
			}
		});
		return this;
	}

	public get isValid(): boolean {
		return this._stateIsValid[0] && this._valid && !this.mainRulesErrors.length;
	}

	public get noError(): boolean {
		return this._stateNoError[0] && !this.mainRulesErrors.length;
	}

	public updateState(): void {
		const isValid = this.formFields.reduce((a, el) => a && el.classList.contains('sg-FormField--isValid'), true) as any;
		const noError = this.formFields.reduce((a, el) => a && !el.classList.contains('sg-FormField--hasError'), true) as any;

		if (this._stateIsValid[0] !== isValid) this._stateIsValid[1](isValid);
		if (this._stateNoError[0] !== noError) this._stateNoError[1](noError);
	}

	public addError(name: string, error: string): this {
		name = !this.allToMainError && this._staticFieldsData[name] ? name : this._mainErrorField;
		const errors = { ...this._stateErrors[0] };
		if (!errors[name]) {
			errors[name] = [];
		}
		errors[name].push(error);
		this._stateErrors[1](errors);
		return this;
	}

	public addMainError(error: string): this {
		return this.addError(this._mainErrorField, error);
	}

	public async scrollToError(): Promise<void> {
		await new Promise(r => setTimeout(r, 200));
		try {
			if (this.rootElement) {
				const fields = this.rootElement.querySelectorAll('.sg-FormError');
				let field: HTMLDivElement = null as any;
				fields.forEach((f: any) => {
					field = field || f;
					field = f.offsetTop < field.offsetTop ? f : field;
				});
				if (field) {
					field.parentElement?.parentElement?.scrollIntoView({
						behavior: 'smooth'
					});
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	public async call(callback: () => Promise<void>, options: {
		scrollToError?: boolean,
		cbError?: () => void,
		cbFrontError?: (e?: any) => void,
		cbBackError?: (e?: any) => void
	} = {}): Promise<boolean> {

		options = {
			scrollToError: true,
			...options
		};
		this._stateLoading[1](true);

		try {
			this.clearErrors();
			await this.markTouched();
			if (this.isValid) {
				await callback();
				return true;
			} else {
				if (options.cbFrontError) { options.cbFrontError(); }
				if (options.cbError) { options.cbError(); }
				if (options.scrollToError) { this.scrollToError(); }
				return false;
			}
		} catch (e) {
			this.fromError(e);
			if (options.cbBackError) { options.cbBackError(e); }
			if (options.cbError) { options.cbError(); }
			if (options.scrollToError) { this.scrollToError(); }
			return false;
		} finally {
			this._stateLoading[1](false);
		}
	}

	public fromError(e: any): void {

		let found = false;

		const parseGQLError = (errors: readonly GraphQLError[]) => {
			for (const error of errors) {
				const path = [...(error?.path || [ 'root' ])];
				path.shift();
				const name = path.join('.');
				const field = this._staticFieldsData[name] ? name : this._mainErrorField;
				this.addError(field, error.message);
				found = true;
			}
		};

		if (e instanceof ApolloError) {
			parseGQLError(e.graphQLErrors);
		}
		if (e instanceof GQLResultError) {
			parseGQLError(e.result.errors || []);
		}

		if (!found){
			console.error(e);
			this.addMainError(e.message || this._genericErrorLabel);
		}
	}
}

// useForm qui va avec a séparer dans un fichier

import { Form } from '@/libs/form/Form';
import { FormEvent, useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

export function useForm(
	{
		fields = {},
		handle,
		genericErrorLabel = null,
		mainErrorField = Form.ROOT_FIELD,
		maxErrorByField = null,
		valid = true,
	}: {
		fields?: Record<string, any>
		handle: (event?: FormEvent) => any,
		genericErrorLabel?: Nullable<string>,
		mainErrorField?: string,
		maxErrorByField?: Nullable<number>,
		valid?: boolean,
	}
): Form {

	const { t } = useTranslation();
	const stateIsValid = useState<boolean>(false);
	const stateNoError = useState<boolean>(false);
	const stateLoading = useState<boolean>(false);
	const stateErrors = useState<Record<string, string[]>>({});

	if (!genericErrorLabel) {
		genericErrorLabel = t('validators.main_error');
	}

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const form = new Form(
		stateIsValid,
		stateNoError,
		stateLoading,
		stateErrors,
		fields,
		genericErrorLabel as string,
		mainErrorField,
		handle,
		valid,
		maxErrorByField
	);

	useEffect(() => {
		form.updateState();
	}, [ form ]);

	return form;
}
