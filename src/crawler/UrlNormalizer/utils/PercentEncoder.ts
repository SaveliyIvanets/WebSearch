
export class PercentEncoder {
  
    /** Unreserved: A-Z a-z 0-9 - . _ ~ */
    private static readonly UNRESERVED = /[A-Za-z0-9\-._~]/;
  
    /** gen-delims: : / ? # [ ] @ */
    private static readonly GEN_DELIMS = /[:/?#\[\]@]/;
  
    /** sub-delims: ! $ & ' ( ) * + , ; = */
    private static readonly SUB_DELIMS = /[!$&'()*+,;=]/;
  
    /** Reserved = gen-delims + sub-delims */
    private static readonly RESERVED = /[:/?#\[\]@!$&'()*+,;=]/;
  
    /** Проверка hex-символа */
    private static readonly HEX_CHAR = /[0-9A-Fa-f]/;
  
    static normalize(
      input: string,
    ): string {
  
      if (!input) return '';
  
      const result: string[] = [];
      let i = 0;
  
      while (i < input.length) {
        const ch = input[i];
  
        // Случай 1: percent-encoded последовательность
        if (ch === '%' && this.isPercentTriplet(input, i)) {
          const hex = input.substring(i + 1, i + 3);
          const decoded = this.decodeHex(hex);
  
          // Решаем, декодировать или оставить закодированным
          if (
            this.isUnreserved(decoded) &&
            !this.isReserved(decoded)
          ) {
            result.push(decoded);
          } else {
            // Оставляем закодированным, приводим hex к uppercase
            const normalizedHex = hex.toUpperCase();
            result.push('%' + normalizedHex);
          }
  
          i += 3;
          continue;
        }
  
        // Случай 2: некорректный '%' (не triplet) — оставляем как есть
        if (ch === '%') {
          result.push('%');
          i++;
          continue;
        }
  
        // Случай 3: обычный символ
        if (this.isUnreserved(ch) || this.isReserved(ch)) {
          // Безопасный или reserved — оставляем как есть
          result.push(ch);
        } else {
          // Небезопасный — кодируем
          result.push(this.encodeChar(ch));
        }
  
        i++;
      }
  
      return result.join('');
    }
  
    /**
     * Проверяет, является ли строка валидной percent-encoded последовательностью
     */
    static isValidEncoding(input: string): boolean {
      let i = 0;
      while (i < input.length) {
        if (input[i] === '%') {
          if (!this.isPercentTriplet(input, i)) {
            return false;
          }
          i += 3;
        } else {
          i++;
        }
      }
      return true;
    }
  
    // ============ ПРИВАТНЫЕ МЕТОДЫ ============
  
    /**
     * Проверяет, является ли последовательность начиная с index
     * валидным percent-triplet: %XX
     */
    private static isPercentTriplet(str: string, index: number): boolean {
      if (index + 2 >= str.length) return false;
      if (str[index] !== '%') return false;
      
      return (
        this.HEX_CHAR.test(str[index + 1]) &&
        this.HEX_CHAR.test(str[index + 2])
      );
    }
  
    /**
     * Декодирует hex-пару в символ
     */
    private static decodeHex(hex: string): string {
      return String.fromCharCode(parseInt(hex, 16));
    }
  
    /**
     * Проверяет, является ли символ unreserved
     */
    private static isUnreserved(ch: string): boolean {
      return this.UNRESERVED.test(ch);
    }
  
    /**
     * Проверяет, является ли символ reserved
     */
    private static isReserved(ch: string): boolean {
      return this.RESERVED.test(ch);
    }
  
    /**
     * Кодирует один символ (учитывая UTF-8 для не-ASCII)
     */
    private static encodeChar(ch: string): string {
      return encodeURIComponent(ch);
    }
}