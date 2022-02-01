export class CSVParser {
	#data;
	#header;
	constructor(input, {
		seperator = ',',
		newline = '\r\n',
		quote = '"',
		header = true,
		skipComment = true,
		mapHeader = null,
		mapValue = null
	} = {/* config */}) {
		// Convert config values to appropriate types
		seperator = String(seperator);
		quote = String(quote);
		newline = String(newline);
		header = Boolean(header);
		skipComment = Boolean(skipComment);
		
		// Check data integrity
		if(typeof input !== 'string') {
			throw new Error('Invalid CSV input');
		}
		if(seperator.length !== 1) {
			throw new Error('Invalid CSV seperator');
		}
		if(quote.length !== 1) {
			throw new Error('Invalid CSV quote');
		}
		
		// Split into lines
		this.#data = input.split(newline);

		// Split lines into columns
		this.#data = this.#data.map(function(ln) {
			if(ln.length === 0) {
				return null;
			}
			if(skipComment && ln[0] === '#') {
				return null;
			}
			const row = [];

			let inqoute = false, col = [];

			let c = null, n = ln[0];
			const end = ln.length;
			for(let i = 1; i < end; i++) {
				[c,n] = [n, ln[i]];
				switch(c) {
					case seperator:
						if(inqoute) {
							col.push(c);
						} else {
							row.push(col.join(''));
							col = [];
						}
						break;
					case quote:
						if(inqoute) {
							if(n !== quote) {
								inqoute = false;
							} else {
								col.push(c);
							}
						} else {
							inqoute = true;
						}
						break;
					default:
						col.push(c);
						break;
				}
			}

			switch(n) {
				case seperator:
					if(inqoute) {
						col.push(n);
					} else {
						row.push(col.join(''));
						col = [];
					}
					break;
				case quote:
					if(!inqoute) {
						col.push(n);
					}
					break;
				default:
					col.push(n);
			}

			row.push(col.join(''));
			return row;
		}).filter(ln => ln !== null);
		
		// Verify row size integrity
		const rowSize = Array.isArray(this.#data[0] ?? null) ? this.#data[0].length : 0;
		for(const row of this.#data) {
			if(rowSize !== row.length) {
				throw new Error(`All CSV rows don't have the same size`);
			}
		}
		// Extract or create header
		if(header) {
			this.#header = this.#data.shift();
		} else {
			this.#header = [];
			for(let i = 0; i < rowSize; i++) {
				this.#header.push(`col_${i}`);
			}
		}
		// Map header
		if(typeof mapHeader === 'function') {
			this.#header = this.#header.map(mapHeader);
		}

		// Map values
		if(typeof mapValue === 'function') {
			const newData = [];
			for(let row of this.#data) {
				newData.push(row.map(mapValue));
			}
			this.#data = newData;
		}
	}
	get header() {
		return this.#header;
	}
	get data() {
		return this.#data;
	}
	table() {
		return [this.#header, ...this.#data];
	}
	objList() {
		return this.#data.map(row => Object.fromEntries(row.map((col, i) => [this.#header[i] ?? `col_${i}`, col])));
	}
}