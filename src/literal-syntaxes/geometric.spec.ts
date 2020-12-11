import 'mocha';
import 'chai';
import { lexer } from './geometric-lexer';
import { expect, assert } from 'chai';
import { parseGeometricLiteral } from '../parser';
import { Optional } from '../utils';
import { Token } from 'moo';
import { Segment, Box, Line, Point } from '../syntax/ast';

describe('Geometric literals', () => {

    const hasContent = [
        /^int$/,
        /^float$/,
    ]
    function next(expected: any) {
        const result = lexer.next() as Optional<Token>;
        delete result.toString;
        delete result.col;
        delete result.line;
        delete result.lineBreaks;
        delete result.offset;
        delete result.text;
        if (!hasContent.some(x => x.test(result.type!))) {
            delete result.value;
        }
        expect(result).to.deep.equal(expected);
    }

    it('Lexer: various tokens', () => {
        lexer.reset(`(12,)<>{}`);
        next({ type: 'lparen' });
        next({ type: 'int', value: '12' });
        next({ type: 'comma' });
        next({ type: 'rparen' });
        next({ type: 'lcomp' });
        next({ type: 'rcomp' });
        next({ type: 'lcurl' });
        next({ type: 'rcurl' });
    });

    it('Lexer: tokenizes comma', () => {
        lexer.reset('2,2');
        next({ type: 'int', value: '2' });
        next({ type: 'comma' });
        next({ type: 'int', value: '2' });
    })


    it('Lexer: tokenizes floats', () => {
        lexer.reset('1.,.1,-.1,-0.1,0.1,10.,-10.');
        next({ type: 'float', value: '1.' });
        next({ type: 'comma' });
        next({ type: 'float', value: '.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-0.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '0.1' });
        next({ type: 'comma' });
        next({ type: 'float', value: '10.' });
        next({ type: 'comma' });
        next({ type: 'float', value: '-10.' });
    })

    it('parses point', () => {
        const point: Point = { x: 1, y: 2 };
        expect(parseGeometricLiteral('(1,2)', 'point')).to.deep.equal(point);
        expect(parseGeometricLiteral('.1,2.', 'point')).to.deep.equal({ x: .1, y: 2 });
        expect(parseGeometricLiteral(' 1.1 , .2 ', 'point')).to.deep.equal({ x: 1.1, y: 0.2 });
    })


    it('parses line', () => {
        const line: Line = { a: 1, b: 2, c: 3 };
        expect(parseGeometricLiteral('{1,2,3}', 'line')).to.deep.equal(line);
    })

    it('parses box', () => {
        const box: Box = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
        expect(parseGeometricLiteral('((1,2),(3,4))', 'box')).to.deep.equal(box);
        expect(parseGeometricLiteral('(1,2),(3,4)', 'box')).to.deep.equal(box);
        expect(parseGeometricLiteral('(1,2,3,4)', 'box')).to.deep.equal(box);
        expect(parseGeometricLiteral('1 , 2 , 3 , 4', 'box')).to.deep.equal(box);
    })

    it('parses segment', () => {
        const lseg: Segment = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
        expect(parseGeometricLiteral('[(1,2),(3,4)]', 'lseg')).to.deep.equal(lseg);
        expect(parseGeometricLiteral('((1,2),(3,4))', 'lseg')).to.deep.equal(lseg);
        expect(parseGeometricLiteral('(1,2),(3,4)', 'lseg')).to.deep.equal(lseg);
        expect(parseGeometricLiteral('(1,2,3,4)', 'lseg')).to.deep.equal(lseg);
        expect(parseGeometricLiteral('1 , 2 , 3 , 4', 'lseg')).to.deep.equal(lseg);
    })

    it('parses closed paths', () => {
        const path = { closed: true, path: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] };
        expect(parseGeometricLiteral('((1,2),(3,4), (5,6))', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('(1,2),(3,4), 5,6', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('(1,2,3,4, (5,6))', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('1 , 2 , 3 , 4, (5,6)', 'path')).to.deep.equal(path);
    })

    it('parses open paths', () => {
        const path = { closed: false, path: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] };
        expect(parseGeometricLiteral('[(1,2),(3,4), (5,6)]', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('[(1,2),(3,4), 5,6]', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('[1,2,3,4, (5,6)]', 'path')).to.deep.equal(path);
        expect(parseGeometricLiteral('[1 , 2 , 3 , 4, (5,6)]', 'path')).to.deep.equal(path);
    });



    it('parses polygon', () => {
        const polygon = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
        expect(parseGeometricLiteral('((1,2),(3,4), (5,6))', 'polygon')).to.deep.equal(polygon);
        expect(parseGeometricLiteral('(1,2),(3,4), 5,6', 'polygon')).to.deep.equal(polygon);
        expect(parseGeometricLiteral('(1,2,3,4, (5,6))', 'polygon')).to.deep.equal(polygon);
        expect(parseGeometricLiteral('1 , 2 , 3 , 4, (5,6)', 'polygon')).to.deep.equal(polygon);
    });


    it('parses circle', () => {
        const circle = { c: { x: 1, y: 2 }, r: 3 };
        expect(parseGeometricLiteral('<(1,2),3>', 'circle')).to.deep.equal(circle);
        expect(parseGeometricLiteral('((1,2),3)', 'circle')).to.deep.equal(circle);
        expect(parseGeometricLiteral('(1,2),3', 'circle')).to.deep.equal(circle);
        expect(parseGeometricLiteral('1,2,3', 'circle')).to.deep.equal(circle);
    });
});