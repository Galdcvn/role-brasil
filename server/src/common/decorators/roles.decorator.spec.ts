import 'reflect-metadata';
import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('should set the roles metadata', () => {
    const target = () => undefined;
    Roles('ORGANIZADOR', 'PORTARIA')(target);
    expect(Reflect.getMetadata(ROLES_KEY, target)).toEqual([
      'ORGANIZADOR',
      'PORTARIA',
    ]);
  });
});
