import { Pipe, PipeTransform } from '@angular/core';
/*
 * Restricts the length of the string and will replace the extra characters with
 *  ellipses. Takes a length argument.
 * Usage:
 *   value | lengthRestrict:length
 * Example:
 *   {{ "Example" | lengthRestrict:2 }}
 *   formats to: Ex...
*/
@Pipe({ name: 'lengthRestrict' })
export class LengthRestrictPipe implements PipeTransform {
  transform(value: string, length: number): string {
    if (value.length <= length) {
      return value;
    }
    return `${value.substr(0, length)}...`;
  }
}
