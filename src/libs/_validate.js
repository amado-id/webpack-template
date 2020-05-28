class FormObj {
	constructor(form, array) {
		// Селектор формы
		this.form = form;
		// Переданные параметры
		this.params = array;
		// Текущий статус формы (можно отправлять или нет)
		this.status = false;
		// Классы, назначаемые полям
		this.classes = {
			correct: this.params.classes['correct'] ? this.params.classes['correct'] : 'correct',
			empty: this.params.classes['empty'] ? this.params.classes['empty'] : 'empty',
			error: this.params.classes['error'] ? this.params.classes['error'] : 'error',
		};
		// Предустановленные регулярки для ограничения ввода символов в реальном времени
		this.realTimePresets = {
			text: /[^\,A-Za-zА-Яа-я0-9 ]+/g,
			phone: /[^0-9+-_() ]+/g,
			num: /[^0-9]+/g,
			letters: /[^a-zA-Zа-яА-я]+/g,
			email: /[^A-Za-zА-Яа-я0-9@._-]+/g
		};
		// Предустановленные регулярки для окончательной проверки
		this.presets = {
			email: /^[.0-9a-zA-Zа-яА-Я_-]+@[0-9a-zA-Zа-яА-Я_-]+?\.[a-zA-Zа-яА-Я]{2,}$/,
			phone: /^((\+7|7|8)+([0-9()-_ ]){10,20})$/
		};
		// Массивы ивентов формы
		this.events = {
			beforeSubmit: [],
			submit: [],
			error: [],
			empty: [],
			correct: []
		};
		// Навешивание ивентов при инициализации формы
		this.addEvents();
	}

	// Валидация формы
	validate() {
		// Проверяем каждое поле и назначаем классы
		this.params.fields.forEach((field) => {
			this.validateField(field);
		})

		// Проверка на корректность всех полей
		this.status = this.params.fields.every((field) => {
			return field.status;
		})
	}

	// Валидация поля
	validateField(field) {
		let elem;
		// Если передан класс, ищем поле по классу, иначе - по name
		if (!(field.fieldName[0] == '.')) {
			elem = this.form.querySelector(`input[name='${field.fieldName}']`);
		} else {
			elem = this.form.querySelector(`${field.fieldName}`);
		}
		if (elem) {

			// Проверка на пустоту, если поле обязательное
			if (elem.value.length == 0 && field.required) {
				this.setClass(elem, 'empty');
				field.status = false;
				if (this.events.empty.length) {
					this.events.empty.forEach((func) => func(elem));
				}
				return;
			}

			// Проверка на длину
			if (field.maxLength && elem.value.length > field.maxLength) {
				this.setClass(elem, 'error');
				field.status = false;
				if (this.events.error.length) {
					this.events.error.forEach((func) => func(elem));
				}
				return;
			}

			// Проверка регулярным выражением
			if (field.regExp) {
				let regExp = this.presets[field.regExp] ? this.presets[field.regExp] : field.regExp;
				if (!regExp.test(elem.value)) {
					this.setClass(elem, 'error');
					field.status = false;
					if (this.events.error.length) {
						this.events.error.forEach((func) => func(elem));
					}
					return;
				}
			}

			// Если все проверки прошли
			this.setClass(elem, 'correct');
			field.status = true;
			if (this.events.correct.length) {
				this.events.correct.forEach((func) => func(elem));
			}
		} else {
			field.status = true;
		}
	}

	// Маска поля
	mask(e, mask, regExp = /\D/g) {
		if (e.inputType != 'deleteContentBackward' && e.inputType != 'deleteByCut' && e.inputType != 'deleteContentForward') {
			// Позиция курсора
			const startPosition = e.target.selectionStart;
			const endPosition = e.target.value.length;
			// Получение символов без маски
			const value = e.target.value.replace(regExp, '');
			// Проверка на наличие символов подходящих под регулярку в маске
			const maskValue = mask.replace(regExp, '');
			let maskCount = 0;
			if (maskValue.length) {
				maskCount = maskValue.length;
			}
			// Подставление символов в маску
			for (; maskCount < value.length; maskCount++) {
				mask = mask.replace('*', value[maskCount])
			}
			// Обрезка до первого символа маски и замена value
			e.target.value = mask.split('*')[0];
			// Установка курсора в нужное место, если пишем не в конце строки
			if (startPosition != endPosition) {
				e.target.selectionStart = startPosition;
				e.target.selectionEnd = startPosition;
			}
		}
	}

	// Функция для добавления ивентов в существующий объект формы
	on(event, func) {
		if (this.events[event]) {
			this.events[event].push(func);
		}
	}

	// Установка классов полям формы при валидации
	setClass(elem, status) {
		// Добавляем нужный класс, убираем все остальные
		Object.keys(this.classes).forEach((cl) => {
			if (cl == status) {
				elem.classList.add(this.classes[cl]);
			} else {
				elem.classList.remove(this.classes[cl]);
			}
		})
	}

	// Навешивание эвентов
	addEvents() {
		// Перебор переданных полей для валидации
		this.params.fields.forEach((field) => {
			// Текущий элемент
			let elem;
			// Если передан класс, ищем поле по классу, иначе - по name
			if (!(field.fieldName[0] == '.')) {
				elem = this.form.querySelector(`input[name='${field.fieldName}']`);
			} else {
				elem = this.form.querySelector(`${field.fieldName}`);
			}
			// Добавляем каждому полю статус, для дальнейшей валидации
			field.status = false;

			if (elem) {
				// Ограничение на ввод лишних символов
				if (field.realTime) {
					elem.addEventListener('input', () => {
						let regExp = this.realTimePresets[field.realTimeRegExp] ? this.realTimePresets[field.realTimeRegExp] : field.realTimeRegExp;
						elem.value = elem.value.replace(regExp, '');
					})
				}

				// Валидация при переходе с поля
				if (this.params.focusValidate) {
					elem.addEventListener('change', () => {
						this.validateField(field);
					})
				}

				// Маска
				if (field.mask) {
					elem.maxLength = field.mask.length;
					if (field.maskRegExp) {
						elem.addEventListener('input', (e) => this.mask(e, field.mask, field.maskRegExp));
					} else {
						elem.addEventListener('input', (e) => this.mask(e, field.mask));
					}

				}
			}
		})

		if (this.form) {
			// Отправка формы
			this.form.addEventListener('submit', (e) => {
				this.validate();
				// Проверка статуса формы для отправки
				if (this.status) {
					// Если есть ивент "Перед отправкой формы", выполняем
					if (this.events.beforeSubmit.length) {
						this.events.beforeSubmit.forEach((func) => func());
					}
					// Если есть переданная функция для отправки - выполняем ее. Иначе - отправляем форму.
					if (this.events.submit.length) {
						this.events.submit.forEach((func) => func(e));
					} else {
						this.form.submit();
					}
				} else {
					e.preventDefault();
				}
			})
		}
	}
};

// Класс для управления формами
export default class Form {
	constructor(form, params) {
		this.forms = [];
		if (!(form instanceof Element)) {
			form.forEach(item => {
				if (item) {
					this.forms.push(new FormObj(item, params));
				}
			})
		} else {
			if (form) {
				this.forms.push(new FormObj(form, params));
			}
		}
	}

	on(event, func) {
		this.forms.forEach(item => {
			item.on(event, func);
		})
	}
}