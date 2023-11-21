import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from 'react';
import FormField from '../FormField';
import { useGenericFormField } from '../common';


export interface SharedFieldProps<T = any> {
	/**
	 * HTML class name
	 */
	className?: string
	/**
	 * Id du form field
	 */
	id?: string;

	/**
	 * Value associée au field
	 */
	value?: T;

	/**
	 * Au changement de la value
	 */
	onChange?: (value: T) => any,

	/**
	 * Label du form field
	 */
	label?: ReactNode | string;

	/**
	 * Name du form field
	 */
	name?: string;

	/**
	 * Règles de validation
	 */
	rules?: FormRule[],

	/**
	 * Valeur hint (en petit en bas a droite)
	 */
	hint?: ReactNode,

	/**
	 * Quand le field passe à touché
	 */
	onTouched?: () => any,

	/**
	 * Ajoute un bouton clear
	 */
	clearable?: boolean,

	/**
	 * affiche un loader
	 */
	loading?: boolean,
	/**
	 * Marque le field comme read-only
	 */
	readOnly?: boolean,
	/**
	 * Marque le field comme disabled
	 */
	disabled?: boolean,
	/**
	 * Affichier ou pas le hint
	 */
	hideHint?: boolean,

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


export interface TextFieldProps extends SharedFieldProps {
	/**
	 * Placeholder du champs
	 */
	placeholder?: string,
	/**
	 * Type de l'input
	 */
	type?: string;
	/**
	 * Propriété supplémentaire du champs input natif
	 */
	inputProps?: Partial<InputHTMLAttributes<HTMLInputElement>>
}

export default function TextField(
	{
		className = '',
		value,
		id,
		name,
		type = 'text',
		onChange,
		inputProps = {},
		disabled,
		readOnly,
		placeholder,
		...args
	}: TextFieldProps
) {
	const generic = useGenericFormField(id, value, onChange, '');

	const handleChange = (event: ChangeEvent<any>) => {
		const value = event.target.value;
		generic.setValue(value);
		if (inputProps.onChange) {
			inputProps.onChange(event);
		}
	};

	const onFocus = (event: FocusEvent<any>) => {
		generic.setFocus(true);
		if (inputProps.onFocus) {
			return inputProps.onFocus(event);
		}
	};
	const onBlur = (event: FocusEvent<any>) => {
		generic.setFocus(false);
		generic.setTouched(true);
		if (inputProps.onBlur) {
			return inputProps.onBlur(event);
		}
	};

	const computedValue = generic.value !== null ? generic.value : '';

	return (
		<FormField
			{...args}
			className={'sg-TextField ' + className}
			{...generic.propsFields}
			disabled={disabled}
			readOnly={readOnly}
		>
			<input
				id={generic.id}
				type={type}
				name={name}
				placeholder={placeholder}
				value={computedValue}
				{...inputProps}
				onChange={handleChange}
				onFocus={onFocus}
				onBlur={onBlur}
				disabled={disabled}
				readOnly={readOnly}
			/>
		</FormField>
	);
}
