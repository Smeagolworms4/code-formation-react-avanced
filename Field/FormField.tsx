import type { HTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { prevent, stop } from '../../libs/candy';
import Button, { ButtonProps } from '../Button';
import FormErrors from '../FormErrors';
import Icon from '../Icon';
import CircleLoader from '../CircleLoader';

export type FormRule = (value?: any) => true | string;


export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
	/**
	 * Contenue du form field
	 */
	children: ReactNode,

	/**
	 * Class associé au form fields
	 */
	className?: string,

	/**
	 * Name de l'input
	 */
	name?: ReactNode,

	/**
	 * Label du form field
	 */
	label?: ReactNode,

	/**
	 * Attribut for à associé au label
	 */
	forAttr?: string,

	/**
	 * Value associée au field
	 */
	value?: any,

	/**
	 * Règles de validation
	 */
	rules?: FormRule[],

	/**
	 * Fonction qui va tester si la value est vide
	 */
	hasValueCallback?: (value: any) => boolean;

	/**
	 * Valeur hint (en petit en bas a droite)
	 */
	hint?: ReactNode,

	/**
	 * Ajoute un bouton clear
	 */
	clearable?: boolean,

	/**
	 * affiche un loader
	 */
	loading?: boolean,

	// < variants
	/**
	 * Applique la variante fullWith (toute la largeur)
	 */
	fullWidth?: boolean
	/**
	 * Applique la variante inlined (pas de bordure)
	 */
	inlined?: boolean
	/**
	 * Applique la variante block (pas de bordure)
	 */
	block?: boolean
	// variants >

	// < states
	/**
	 * Marque le field comme focused
	 */
	focus?: boolean,
	/**
	 * Marque le field comme read-only
	 */
	readOnly?: boolean,
	/**
	 * Marque le field comme disabled
	 */
	disabled?: boolean,
	/**
	 * Marque le field comme touché
	 */
	touched?: boolean,
	/**
	 * Affichier ou pas lz hint
	 */
	hideHint?: boolean,
	/**
	 * Quand le field passe à touché
	 */
	onTouched?: () => any,
	/**
	 * Quand le field passe à non touché
	 */
	onUnTouch?: () => any,
	/**
	 * Quand on clear le champs
	 */
	onClear?: () => any,
	// states >

	// < slots
	/**
	 * Slot avant le champs mais à l'intérieur du form field
	 */
	slotPrepend?: ReactNode,
	/**
	 * Slot après le champs mais à l'intérieur du form field
	 */
	slotAppend?: ReactNode,
	/**
	 * Slot avant le champs mais à l'extérieur du form field
	 */
	slotPrependOutside?: ReactNode,
	/**
	 * Slot après le champs mais à l'extérieur du form field
	 */
	slotAppendOutside?: ReactNode,
	// slots >

	// < icons
	/**
	 * Icon avant le champs mais à l'intérieur du form field
	 */
	iconPrepend?: string,
	/**
	 * Icon après le champs mais à l'intérieur du form field
	 */
	iconAppend?: string,
	/**
	 * Icon avant le champs mais à l'extérieur du form field
	 */
	iconPrependOutside?: string,
	/**
	 * Icon après le champs mais à l'extérieur du form field
	 */
	iconAppendOutside?: string,
	/**
	 * Props du Button du prepend icon
	 */
	iconPrependProps?: Partial<ButtonProps>,
	/**
	 * Props du Button du append icon
	 */
	iconAppendProps?: Partial<ButtonProps>,
	/**
	 * Props du Button du prepend icon outside
	 */
	iconPrependOutsideProps?: Partial<ButtonProps>,
	/**
	 * Props du Button du append icon outside
	 */
	iconAppendOutsideProps?: Partial<ButtonProps>,
	// icons >
}

export default function FormField(
	{
		children,
		className = '',
		name = '',
		label,
		forAttr = '',
		value,
		rules,
		hasValueCallback = v => (
			v !== null &&
			typeof v !== 'undefined' &&
			v !== '' &&
			!(Array.isArray(v) && v.length === 0) &&
			!(typeof v === 'object' && Object.keys(v).length === 0)
		),
		hint,
		clearable = false,
		loading = false,

		// < variants
		fullWidth = false,
		inlined = false,
		block = false,
		// variants >

		// < states
		focus = false,
		readOnly = false,
		disabled = false,
		hideHint = false,
		touched = false,
		onTouched = () => {
		},
		onUnTouch = () => {
		},
		onClear = () => {
		},
		// states >

		//< slots
		slotPrepend,
		slotAppend,
		slotPrependOutside,
		slotAppendOutside,
		// slots >

		//< icons
		iconPrepend,
		iconAppend,
		iconPrependOutside,
		iconAppendOutside,
		iconPrependProps = {},
		iconAppendProps = {},
		iconPrependOutsideProps = {},
		iconAppendOutsideProps = {},
		// icons >

		...rest
	}: FormFieldProps
) {
	// < state

	const [touchedComputed, setTouchedComputed] = useState(touched);
	const ref = useRef<HTMLDivElement>(null);

	const markTouched = useCallback(() => {
		if (!touchedComputed) {
			setTouchedComputed(true);
			onTouched();
		}
	}, [
		touchedComputed,
		setTouchedComputed,
		onTouched
	]);

	const markUnTouch = useCallback(() => {
		if (touchedComputed) {
			setTouchedComputed(false);
			onUnTouch();
		}
	}, [
		touchedComputed,
		setTouchedComputed,
		onUnTouch
	]);

	useEffect(() => {
		if (touched) {
			markTouched();
		}
	}, [touched, markTouched]);

	useEffect(() => {
		if (ref.current) {
			(ref.current as any).sgFormMarkTouched = () => {
				markTouched();
			};
			(ref.current as any).sgFormMarkUntouched = () => {
				markUnTouch();
			};
			(ref.current as any).sgFormMarkClear = () => {
				onClear();
				markUnTouch();
			};
		}
	}, [ref, markTouched, markUnTouch, setTouchedComputed, onClear]);

	useEffect(() => {
		if (touchedComputed) {
			if (ref.current) {
				const nodes: HTMLElement[] = [];
				let element: HTMLElement = ref.current;
				while (element.parentElement) {
					if (element.parentElement.classList.contains('sg-FormField')) {
						nodes.push(element.parentElement);
					}
					element = element.parentElement;
				}
				nodes.forEach(el => {
					if ((el as any).sgFormMarkTouched) {
						(el as any).sgFormMarkTouched();
					}
				});
			}
		}
	}, [touchedComputed]);

	// state >

	const errors = (rules || [])
		.map(rule => rule(value))
		.filter(value => value !== true) as string[]
	;
	const hasValue = hasValueCallback(value);

	return (
		<div
			{...rest}
			ref={ref}
			className={[
				'sg-FormField',
				className,
				(errors.length && touchedComputed ? 'sg-FormField--hasError' : ''),
				(errors.length ? '' : 'sg-FormField--isValid'),
				(hasValue ? 'sg-FormField--hasValue' : ''),
				(readOnly ? 'sg-FormField--readonly' : ''),
				(focus ? 'sg-FormField--focused' : ''),
				(touchedComputed ? 'sg-FormField--touched' : ''),
				(disabled ? 'sg-FormField--disabled' : ''),
				(clearable ? 'sg-FormField--clearable' : ''),
				(fullWidth ? 'sg-FormField--fullWidth' : ''),
				(inlined ? 'sg-FormField--inlined' : ''),
				(block ? 'sg-FormField--block' : ''),
			].join(' ')}
			data-name={name}
		>
			{label ? (
				<label className="sg-FormField-label" htmlFor={forAttr}>
					{label}
				</label>
			) : <></>}

			<div className="sg-FormField-content">

				{(slotPrependOutside || iconPrependOutside) ? (
					<div className="sg-FormField-prependOutside">
						{slotPrependOutside || <></>}
						{iconPrependOutside ? (
							<Button
								type="button"
								icon
								rounded
								size="smallest"
								{...iconPrependOutsideProps}
								className={'sg-FormField-prependOutside-icon ' + (iconPrependOutsideProps.className || '')}
							>
								<Icon>{iconPrependOutside}</Icon>
								{iconPrependOutsideProps.children && <span className="u-srOnly">{iconPrependOutsideProps.children}</span>}
							</Button>
						) : <></>}
					</div>
				) : <></>}

				<div className="sg-FormField-control">

					{slotPrepend || iconPrepend ? (
						<div className="sg-FormField-prepend">
							{iconPrepend ? (
								<Button
									type="button"
									icon
									rounded
									size="smallest"
									{...iconPrependProps}
									className={'sg-FormField-prepend-icon ' + (iconPrependProps.className || '')}
								>
									<Icon>{iconPrepend}</Icon>
									{iconPrependProps.children && <span className="u-srOnly">{iconPrependProps.children}</span>}
								</Button>
							) : <></>}
							{slotPrepend ? slotPrepend : <></>}
						</div>
					) : <></>}

					<div className="sg-FormField-slot">
						{children}
					</div>

					{slotAppend || clearable || loading || iconAppend ? (
						<div className="sg-FormField-append">
							{slotAppend ? slotAppend : <></>}
							{loading ? (
								<CircleLoader
									className="sg-FormField-loading"
									color="primary"
									diameter={25}
									width={3}
								/>
							) : <></>}
							{clearable ? (
								<Button
									type="button"
									className="sg-FormField-clearable"
									icon
									rounded
									size="smallest"
									color="white"
									disabled={disabled || readOnly}
									onClick={stop(prevent(() => onClear ? onClear() : void 0))}
								>
									<Icon>cross</Icon>
								</Button>
							) : <></>}
							{iconAppend ? (
								<Button
									type="button"
									icon
									rounded
									size="smallest"
									{...iconAppendProps}
									className={'sg-FormField-append-icon ' + (iconAppendProps.className || '')}
								>
									<Icon>{iconAppend}</Icon>
									{iconAppendProps.children && <span className="u-srOnly">{iconAppendProps.children}</span>}
								</Button>
							) : <></>}
						</div>
					) : <></>}

				</div>

				{(slotAppendOutside || iconAppendOutside) ? (
					<div className="sg-FormField-appendOutside">
						{iconAppendOutside ? (
							<Button
								type="button"
								icon
								rounded
								size="smallest"
								{...iconAppendOutsideProps}
								className={'sg-FormField-appendOutside-icon ' + (iconAppendOutsideProps.className || '')}
							>
								<Icon>{iconAppendOutside}</Icon>
								{iconAppendOutsideProps.children && <span className="u-srOnly">{iconAppendOutsideProps.children}</span>}
							</Button>
						) : <></>}
						{slotAppendOutside || <></>}
					</div>
				) : <></>}
			</div>

			{errors.length && touchedComputed ? (
				<FormErrors errors={errors} />
			) : !hideHint ? (
				<span className="sg-FormField-hint">{typeof hint !== 'undefined' ? hint : <>&nbsp;</>}</span>
			) : null}
		</div>
	);
}
