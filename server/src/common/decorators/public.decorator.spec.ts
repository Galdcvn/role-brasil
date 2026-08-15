import 'reflect-metadata';
import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public decorator', () => {
  it('should set the isPublic metadata', () => {
    const target = () => undefined;
    Public()(target);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, target)).toBe(true);
  });
});
