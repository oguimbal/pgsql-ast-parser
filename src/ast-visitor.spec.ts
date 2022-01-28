import 'mocha';
import 'chai';
import { astVisitor } from './ast-visitor';
import { expect } from 'chai';

describe('Ast visitor', () => {

    // just a quickcheck. (those were throwing)
    it('visits ref when implemented', () => {
        let visited = null;
        const mapper = astVisitor(() => ({
            ref: r => visited = r.name,
        }))
        mapper.expr({
            type: 'unary',
            op: 'NOT',
            operand: {
                type: 'ref',
                name: 'myRef'
            }
        })
        expect(visited).to.equal('myRef');
    });

    it('does not visit ref when not implemented', () => {
        let visited = null;
        astVisitor(() => ({
        })).expr({
            type: 'unary',
            op: 'NOT',
            operand: {
                type: 'ref',
                name: 'myRef'
            }
        });
        expect(visited).to.equal(null);
    });


    it('allow super call', () => {
        let visited = null;
        astVisitor(v => ({
            ref: r => {
                visited = r.name;
                return v.super().ref(r);
            },
        })).expr({
            type: 'unary',
            op: 'NOT',
            operand: {
                type: 'ref',
                name: 'myRef'
            }
        })
        expect(visited).to.equal('myRef');
    });
})