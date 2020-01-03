
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.setAttribute('aria-hidden', 'true');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/extra.svelte generated by Svelte v3.16.7 */

    const file = "src/components/extra.svelte";

    function create_fragment(ctx) {
    	let rect0;
    	let t0;
    	let rect1;
    	let t1;
    	let rect2;
    	let t2;
    	let path0;
    	let t3;
    	let polyline;
    	let t4;
    	let rect3;
    	let t5;
    	let rect4;
    	let t6;
    	let rect5;
    	let t7;
    	let rect6;
    	let t8;
    	let rect7;
    	let t9;
    	let rect8;
    	let rect8_transform_value;
    	let t10;
    	let line0;
    	let t11;
    	let line1;
    	let t12;
    	let line2;
    	let t13;
    	let line3;
    	let t14;
    	let line4;
    	let t15;
    	let line5;
    	let t16;
    	let line6;
    	let t17;
    	let line7;
    	let t18;
    	let line8;
    	let t19;
    	let polygon;
    	let t20;
    	let line9;
    	let t21;
    	let line10;
    	let t22;
    	let line11;
    	let t23;
    	let line12;
    	let t24;
    	let line13;
    	let t25;
    	let line14;
    	let t26;
    	let line15;
    	let t27;
    	let line16;
    	let t28;
    	let line17;
    	let t29;
    	let line18;
    	let t30;
    	let line19;
    	let t31;
    	let line20;
    	let t32;
    	let line21;
    	let t33;
    	let line22;
    	let t34;
    	let line23;
    	let t35;
    	let path1;
    	let t36;
    	let line24;
    	let line24_y__value;
    	let t37;
    	let line25;
    	let line25_y__value;
    	let t38;
    	let path2;
    	let path2_style_value;
    	let t39;
    	let line26;
    	let t40;
    	let line27;
    	let t41;
    	let line28;
    	let t42;
    	let line29;
    	let t43;
    	let line30;
    	let t44;
    	let line31;
    	let t45;
    	let line32;
    	let t46;
    	let line33;
    	let t47;
    	let line34;
    	let t48;
    	let line35;
    	let t49;
    	let line36;
    	let t50;
    	let line37;
    	let t51;
    	let line38;
    	let t52;
    	let line39;
    	let t53;
    	let line40;
    	let t54;
    	let line41;
    	let t55;
    	let line42;
    	let t56;
    	let line43;
    	let t57;
    	let line44;
    	let t58;
    	let line45;
    	let t59;
    	let line46;
    	let t60;
    	let line47;
    	let t61;
    	let line48;
    	let t62;
    	let line49;
    	let t63;
    	let line50;
    	let t64;
    	let line51;
    	let t65;
    	let line52;
    	let t66;
    	let line53;
    	let t67;
    	let line54;
    	let t68;
    	let line55;
    	let t69;
    	let line56;
    	let t70;
    	let line57;
    	let t71;
    	let line58;
    	let t72;
    	let line59;
    	let t73;
    	let line60;
    	let t74;
    	let line61;
    	let t75;
    	let line62;
    	let t76;
    	let line63;
    	let t77;
    	let line64;
    	let t78;
    	let line65;
    	let t79;
    	let line66;
    	let t80;
    	let line67;
    	let t81;
    	let line68;
    	let t82;
    	let line69;
    	let t83;
    	let line70;
    	let t84;
    	let line71;
    	let t85;
    	let line72;
    	let t86;
    	let line73;
    	let t87;
    	let line74;
    	let t88;
    	let line75;
    	let t89;
    	let g;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let rect9;
    	let rect10;
    	let path7;
    	let circle;
    	let g_transform_value;
    	let t90;
    	let path8;
    	let t91;
    	let path9;
    	let t92;
    	let rect11;

    	const block = {
    		c: function create() {
    			rect0 = svg_element("rect");
    			t0 = space();
    			rect1 = svg_element("rect");
    			t1 = space();
    			rect2 = svg_element("rect");
    			t2 = space();
    			path0 = svg_element("path");
    			t3 = space();
    			polyline = svg_element("polyline");
    			t4 = space();
    			rect3 = svg_element("rect");
    			t5 = space();
    			rect4 = svg_element("rect");
    			t6 = space();
    			rect5 = svg_element("rect");
    			t7 = space();
    			rect6 = svg_element("rect");
    			t8 = space();
    			rect7 = svg_element("rect");
    			t9 = space();
    			rect8 = svg_element("rect");
    			t10 = space();
    			line0 = svg_element("line");
    			t11 = space();
    			line1 = svg_element("line");
    			t12 = space();
    			line2 = svg_element("line");
    			t13 = space();
    			line3 = svg_element("line");
    			t14 = space();
    			line4 = svg_element("line");
    			t15 = space();
    			line5 = svg_element("line");
    			t16 = space();
    			line6 = svg_element("line");
    			t17 = space();
    			line7 = svg_element("line");
    			t18 = space();
    			line8 = svg_element("line");
    			t19 = space();
    			polygon = svg_element("polygon");
    			t20 = space();
    			line9 = svg_element("line");
    			t21 = space();
    			line10 = svg_element("line");
    			t22 = space();
    			line11 = svg_element("line");
    			t23 = space();
    			line12 = svg_element("line");
    			t24 = space();
    			line13 = svg_element("line");
    			t25 = space();
    			line14 = svg_element("line");
    			t26 = space();
    			line15 = svg_element("line");
    			t27 = space();
    			line16 = svg_element("line");
    			t28 = space();
    			line17 = svg_element("line");
    			t29 = space();
    			line18 = svg_element("line");
    			t30 = space();
    			line19 = svg_element("line");
    			t31 = space();
    			line20 = svg_element("line");
    			t32 = space();
    			line21 = svg_element("line");
    			t33 = space();
    			line22 = svg_element("line");
    			t34 = space();
    			line23 = svg_element("line");
    			t35 = space();
    			path1 = svg_element("path");
    			t36 = space();
    			line24 = svg_element("line");
    			t37 = space();
    			line25 = svg_element("line");
    			t38 = space();
    			path2 = svg_element("path");
    			t39 = space();
    			line26 = svg_element("line");
    			t40 = space();
    			line27 = svg_element("line");
    			t41 = space();
    			line28 = svg_element("line");
    			t42 = space();
    			line29 = svg_element("line");
    			t43 = space();
    			line30 = svg_element("line");
    			t44 = space();
    			line31 = svg_element("line");
    			t45 = space();
    			line32 = svg_element("line");
    			t46 = space();
    			line33 = svg_element("line");
    			t47 = space();
    			line34 = svg_element("line");
    			t48 = space();
    			line35 = svg_element("line");
    			t49 = space();
    			line36 = svg_element("line");
    			t50 = space();
    			line37 = svg_element("line");
    			t51 = space();
    			line38 = svg_element("line");
    			t52 = space();
    			line39 = svg_element("line");
    			t53 = space();
    			line40 = svg_element("line");
    			t54 = space();
    			line41 = svg_element("line");
    			t55 = space();
    			line42 = svg_element("line");
    			t56 = space();
    			line43 = svg_element("line");
    			t57 = space();
    			line44 = svg_element("line");
    			t58 = space();
    			line45 = svg_element("line");
    			t59 = space();
    			line46 = svg_element("line");
    			t60 = space();
    			line47 = svg_element("line");
    			t61 = space();
    			line48 = svg_element("line");
    			t62 = space();
    			line49 = svg_element("line");
    			t63 = space();
    			line50 = svg_element("line");
    			t64 = space();
    			line51 = svg_element("line");
    			t65 = space();
    			line52 = svg_element("line");
    			t66 = space();
    			line53 = svg_element("line");
    			t67 = space();
    			line54 = svg_element("line");
    			t68 = space();
    			line55 = svg_element("line");
    			t69 = space();
    			line56 = svg_element("line");
    			t70 = space();
    			line57 = svg_element("line");
    			t71 = space();
    			line58 = svg_element("line");
    			t72 = space();
    			line59 = svg_element("line");
    			t73 = space();
    			line60 = svg_element("line");
    			t74 = space();
    			line61 = svg_element("line");
    			t75 = space();
    			line62 = svg_element("line");
    			t76 = space();
    			line63 = svg_element("line");
    			t77 = space();
    			line64 = svg_element("line");
    			t78 = space();
    			line65 = svg_element("line");
    			t79 = space();
    			line66 = svg_element("line");
    			t80 = space();
    			line67 = svg_element("line");
    			t81 = space();
    			line68 = svg_element("line");
    			t82 = space();
    			line69 = svg_element("line");
    			t83 = space();
    			line70 = svg_element("line");
    			t84 = space();
    			line71 = svg_element("line");
    			t85 = space();
    			line72 = svg_element("line");
    			t86 = space();
    			line73 = svg_element("line");
    			t87 = space();
    			line74 = svg_element("line");
    			t88 = space();
    			line75 = svg_element("line");
    			t89 = space();
    			g = svg_element("g");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			rect9 = svg_element("rect");
    			rect10 = svg_element("rect");
    			path7 = svg_element("path");
    			circle = svg_element("circle");
    			t90 = space();
    			path8 = svg_element("path");
    			t91 = space();
    			path9 = svg_element("path");
    			t92 = space();
    			rect11 = svg_element("rect");
    			attr_dev(rect0, "id", "XMLID_5_");
    			attr_dev(rect0, "x", "1218.94");
    			attr_dev(rect0, "y", "2272.38");
    			attr_dev(rect0, "transform", "matrix(-1 -4.491664e-11 4.491664e-11 -1 2613.8027 4689.6328)");
    			attr_dev(rect0, "class", "st4 svelte-1mi792v");
    			attr_dev(rect0, "width", "175.92");
    			attr_dev(rect0, "height", "144.88");
    			add_location(rect0, file, 13, 0, 522);
    			attr_dev(rect1, "id", "XMLID_6_");
    			attr_dev(rect1, "x", "1272.41");
    			attr_dev(rect1, "y", "1524.8");
    			attr_dev(rect1, "transform", "matrix(-1 -4.499924e-11 4.499924e-11 -1 2617.2522 3797.1814)");
    			attr_dev(rect1, "class", "st5 svelte-1mi792v");
    			attr_dev(rect1, "width", "72.44");
    			attr_dev(rect1, "height", "747.58");
    			add_location(rect1, file, 15, 2, 689);
    			attr_dev(rect2, "id", "XMLID_9_");
    			attr_dev(rect2, "x", "1275.42");
    			attr_dev(rect2, "y", "1465.7");
    			attr_dev(rect2, "transform", "matrix(-1 -4.518842e-11 4.518842e-11 -1 2617.2522 2990.5002)");
    			attr_dev(rect2, "class", "st4 svelte-1mi792v");
    			attr_dev(rect2, "width", "66.42");
    			attr_dev(rect2, "height", "59.11");
    			add_location(rect2, file, 17, 2, 853);
    			attr_dev(path0, "id", "XMLID_12_");
    			attr_dev(path0, "class", "st4 svelte-1mi792v");
    			attr_dev(path0, "d", "M1275.42,1469.1l0.12-72.1h78.66c-0.03,0.17-0.06,0.35-0.09,0.52\n\t\tc-4.09,23.86-8.18,47.72-12.27,71.58");
    			add_location(path0, file, 18, 1, 1013);
    			attr_dev(polyline, "id", "XMLID_14_");
    			attr_dev(polyline, "class", "st5 svelte-1mi792v");
    			attr_dev(polyline, "points", "1335.8,1393.68 1316.07,1134 1300.84,1134 1281.11,1395.43 \t");
    			add_location(polyline, file, 20, 1, 1154);
    			attr_dev(rect3, "id", "XMLID_10_");
    			attr_dev(rect3, "x", "1301.17");
    			attr_dev(rect3, "y", "1112.42");
    			attr_dev(rect3, "transform", "matrix(-1 -1.120874e-10 1.120874e-10 -1 2617.2351 2246.4202)");
    			attr_dev(rect3, "class", "st4 svelte-1mi792v");
    			attr_dev(rect3, "width", "14.9");
    			attr_dev(rect3, "height", "21.58");
    			add_location(rect3, file, 22, 2, 1265);
    			attr_dev(rect4, "id", "XMLID_11_");
    			attr_dev(rect4, "x", "1258.82");
    			attr_dev(rect4, "y", "1328.39");
    			attr_dev(rect4, "transform", "matrix(-1 -4.490953e-11 4.490953e-11 -1 2614.929 2684.896)");
    			attr_dev(rect4, "class", "st4 svelte-1mi792v");
    			attr_dev(rect4, "width", "97.29");
    			attr_dev(rect4, "height", "28.12");
    			add_location(rect4, file, 24, 2, 1429);
    			attr_dev(rect5, "id", "XMLID_13_");
    			attr_dev(rect5, "x", "885.86");
    			attr_dev(rect5, "y", "1296.59");
    			attr_dev(rect5, "transform", "matrix(-1 -4.491397e-11 4.491397e-11 -1 2144.6775 2653.1025)");
    			attr_dev(rect5, "class", "st5 svelte-1mi792v");
    			attr_dev(rect5, "width", "372.96");
    			attr_dev(rect5, "height", "59.92");
    			add_location(rect5, file, 26, 2, 1592);
    			attr_dev(rect6, "id", "XMLID_15_");
    			attr_dev(rect6, "x", "997.14");
    			attr_dev(rect6, "y", "1356.51");
    			attr_dev(rect6, "transform", "matrix(-1 -4.481183e-11 4.481183e-11 -1 2052.9656 2796.1731)");
    			attr_dev(rect6, "class", "st4 svelte-1mi792v");
    			attr_dev(rect6, "width", "58.7");
    			attr_dev(rect6, "height", "83.15");
    			add_location(rect6, file, 28, 2, 1757);
    			attr_dev(rect7, "id", "XMLID_16_");
    			attr_dev(rect7, "x", "1916.7");
    			attr_dev(rect7, "y", "1349.17");
    			attr_dev(rect7, "transform", "matrix(-1 -4.483848e-11 4.483848e-11 -1 3876.1985 2725.2493)");
    			attr_dev(rect7, "class", "st4 svelte-1mi792v");
    			attr_dev(rect7, "width", "42.8");
    			attr_dev(rect7, "height", "26.9");
    			add_location(rect7, file, 30, 2, 1920);
    			attr_dev(rect8, "id", "XMLID_17_");
    			attr_dev(rect8, "x", "1916.7");
    			attr_dev(rect8, "y", "1532.6");
    			attr_dev(rect8, "transform", rect8_transform_value = `matrix(-1 -4.488111e-11 4.488111e-11 -1 3876.1985 3118.999) translate(0, ${-/*t*/ ctx[0] * 760})`);
    			attr_dev(rect8, "class", "st4 svelte-1mi792v");
    			attr_dev(rect8, "width", "42.8");
    			attr_dev(rect8, "height", "53.8");
    			add_location(rect8, file, 32, 2, 2082);
    			attr_dev(line0, "id", "XMLID_18_");
    			attr_dev(line0, "class", "st5 svelte-1mi792v");
    			attr_dev(line0, "x1", "1301.17");
    			attr_dev(line0, "y1", "1121.11");
    			attr_dev(line0, "x2", "958");
    			attr_dev(line0, "y2", "1356.51");
    			add_location(line0, file, 33, 1, 2267);
    			attr_dev(line1, "id", "XMLID_19_");
    			attr_dev(line1, "class", "st5 svelte-1mi792v");
    			attr_dev(line1, "x1", "1316.07");
    			attr_dev(line1, "y1", "1121.11");
    			attr_dev(line1, "x2", "1743.06");
    			attr_dev(line1, "y2", "1312.49");
    			add_location(line1, file, 34, 1, 2351);
    			attr_dev(line2, "id", "XMLID_24_");
    			attr_dev(line2, "class", "st5 svelte-1mi792v");
    			attr_dev(line2, "x1", "1994.05");
    			attr_dev(line2, "y1", "1361.53");
    			attr_dev(line2, "x2", "1951.54");
    			attr_dev(line2, "y2", "1316.25");
    			add_location(line2, file, 35, 1, 2439);
    			attr_dev(line3, "id", "XMLID_25_");
    			attr_dev(line3, "class", "st5 svelte-1mi792v");
    			attr_dev(line3, "x1", "1951.54");
    			attr_dev(line3, "y1", "1316.25");
    			attr_dev(line3, "x2", "1923.47");
    			attr_dev(line3, "y2", "1356.51");
    			add_location(line3, file, 36, 1, 2527);
    			attr_dev(line4, "id", "XMLID_26_");
    			attr_dev(line4, "class", "st5 svelte-1mi792v");
    			attr_dev(line4, "x1", "1923.47");
    			attr_dev(line4, "y1", "1356.51");
    			attr_dev(line4, "x2", "1883.37");
    			attr_dev(line4, "y2", "1316.25");
    			add_location(line4, file, 37, 1, 2615);
    			attr_dev(line5, "id", "XMLID_27_");
    			attr_dev(line5, "class", "st5 svelte-1mi792v");
    			attr_dev(line5, "x1", "1883.37");
    			attr_dev(line5, "y1", "1316.25");
    			attr_dev(line5, "x2", "1861.72");
    			attr_dev(line5, "y2", "1355.9");
    			add_location(line5, file, 38, 1, 2703);
    			attr_dev(line6, "id", "XMLID_28_");
    			attr_dev(line6, "class", "st5 svelte-1mi792v");
    			attr_dev(line6, "x1", "1861.72");
    			attr_dev(line6, "y1", "1355.9");
    			attr_dev(line6, "x2", "1829.66");
    			attr_dev(line6, "y2", "1313.56");
    			add_location(line6, file, 39, 1, 2790);
    			attr_dev(line7, "id", "XMLID_29_");
    			attr_dev(line7, "class", "st5 svelte-1mi792v");
    			attr_dev(line7, "x1", "1829.66");
    			attr_dev(line7, "y1", "1313.56");
    			attr_dev(line7, "x2", "1804.78");
    			attr_dev(line7, "y2", "1355.9");
    			add_location(line7, file, 40, 1, 2877);
    			attr_dev(line8, "id", "XMLID_30_");
    			attr_dev(line8, "class", "st5 svelte-1mi792v");
    			attr_dev(line8, "x1", "1804.78");
    			attr_dev(line8, "y1", "1355.9");
    			attr_dev(line8, "x2", "1773.51");
    			attr_dev(line8, "y2", "1312.76");
    			add_location(line8, file, 41, 1, 2964);
    			attr_dev(polygon, "id", "XMLID_22_");
    			attr_dev(polygon, "class", "st5 svelte-1mi792v");
    			attr_dev(polygon, "points", "1363.98,1349.17 2049.99,1362.62 2022.92,1316.25 1398.18,1307.43 \t");
    			add_location(polygon, file, 42, 1, 3051);
    			attr_dev(line9, "id", "XMLID_23_");
    			attr_dev(line9, "class", "st5 svelte-1mi792v");
    			attr_dev(line9, "x1", "2022.92");
    			attr_dev(line9, "y1", "1316.25");
    			attr_dev(line9, "x2", "1994.05");
    			attr_dev(line9, "y2", "1361.53");
    			add_location(line9, file, 43, 1, 3165);
    			attr_dev(line10, "id", "XMLID_20_");
    			attr_dev(line10, "class", "st5 svelte-1mi792v");
    			attr_dev(line10, "x1", "1773.51");
    			attr_dev(line10, "y1", "1312.76");
    			attr_dev(line10, "x2", "1747.43");
    			attr_dev(line10, "y2", "1355.9");
    			add_location(line10, file, 44, 1, 3253);
    			attr_dev(line11, "id", "XMLID_21_");
    			attr_dev(line11, "class", "st5 svelte-1mi792v");
    			attr_dev(line11, "x1", "1747.43");
    			attr_dev(line11, "y1", "1355.9");
    			attr_dev(line11, "x2", "1720.91");
    			attr_dev(line11, "y2", "1312.76");
    			add_location(line11, file, 45, 1, 3340);
    			attr_dev(line12, "id", "XMLID_31_");
    			attr_dev(line12, "class", "st5 svelte-1mi792v");
    			attr_dev(line12, "x1", "1720.91");
    			attr_dev(line12, "y1", "1312.76");
    			attr_dev(line12, "x2", "1692.68");
    			attr_dev(line12, "y2", "1353.76");
    			add_location(line12, file, 46, 1, 3427);
    			attr_dev(line13, "id", "XMLID_32_");
    			attr_dev(line13, "class", "st5 svelte-1mi792v");
    			attr_dev(line13, "x1", "1692.68");
    			attr_dev(line13, "y1", "1353.76");
    			attr_dev(line13, "x2", "1663.6");
    			attr_dev(line13, "y2", "1311.18");
    			add_location(line13, file, 47, 1, 3515);
    			attr_dev(line14, "id", "XMLID_33_");
    			attr_dev(line14, "class", "st5 svelte-1mi792v");
    			attr_dev(line14, "x1", "1663.6");
    			attr_dev(line14, "y1", "1311.18");
    			attr_dev(line14, "x2", "1634.08");
    			attr_dev(line14, "y2", "1353.76");
    			add_location(line14, file, 48, 1, 3602);
    			attr_dev(line15, "id", "XMLID_34_");
    			attr_dev(line15, "class", "st5 svelte-1mi792v");
    			attr_dev(line15, "x1", "1634.08");
    			attr_dev(line15, "y1", "1353.76");
    			attr_dev(line15, "x2", "1605.41");
    			attr_dev(line15, "y2", "1310.36");
    			add_location(line15, file, 49, 1, 3689);
    			attr_dev(line16, "id", "XMLID_35_");
    			attr_dev(line16, "class", "st5 svelte-1mi792v");
    			attr_dev(line16, "x1", "1605.41");
    			attr_dev(line16, "y1", "1310.36");
    			attr_dev(line16, "x2", "1574.59");
    			attr_dev(line16, "y2", "1353.3");
    			add_location(line16, file, 50, 1, 3777);
    			attr_dev(line17, "id", "XMLID_36_");
    			attr_dev(line17, "class", "st5 svelte-1mi792v");
    			attr_dev(line17, "x1", "1574.59");
    			attr_dev(line17, "y1", "1353.3");
    			attr_dev(line17, "x2", "1554.52");
    			attr_dev(line17, "y2", "1309.64");
    			add_location(line17, file, 51, 1, 3864);
    			attr_dev(line18, "id", "XMLID_37_");
    			attr_dev(line18, "class", "st5 svelte-1mi792v");
    			attr_dev(line18, "x1", "1554.52");
    			attr_dev(line18, "y1", "1309.64");
    			attr_dev(line18, "x2", "1529.56");
    			attr_dev(line18, "y2", "1352.42");
    			add_location(line18, file, 52, 1, 3951);
    			attr_dev(line19, "id", "XMLID_38_");
    			attr_dev(line19, "class", "st5 svelte-1mi792v");
    			attr_dev(line19, "x1", "1529.56");
    			attr_dev(line19, "y1", "1352.42");
    			attr_dev(line19, "x2", "1501.91");
    			attr_dev(line19, "y2", "1308.9");
    			add_location(line19, file, 53, 1, 4039);
    			attr_dev(line20, "id", "XMLID_39_");
    			attr_dev(line20, "class", "st5 svelte-1mi792v");
    			attr_dev(line20, "x1", "1501.91");
    			attr_dev(line20, "y1", "1308.9");
    			attr_dev(line20, "x2", "1476.66");
    			attr_dev(line20, "y2", "1351.38");
    			add_location(line20, file, 54, 1, 4126);
    			attr_dev(line21, "id", "XMLID_40_");
    			attr_dev(line21, "class", "st5 svelte-1mi792v");
    			attr_dev(line21, "x1", "1476.66");
    			attr_dev(line21, "y1", "1351.38");
    			attr_dev(line21, "x2", "1454.01");
    			attr_dev(line21, "y2", "1308.22");
    			add_location(line21, file, 55, 1, 4213);
    			attr_dev(line22, "id", "XMLID_41_");
    			attr_dev(line22, "class", "st5 svelte-1mi792v");
    			attr_dev(line22, "x1", "1454.01");
    			attr_dev(line22, "y1", "1308.22");
    			attr_dev(line22, "x2", "1426.62");
    			attr_dev(line22, "y2", "1350.4");
    			add_location(line22, file, 56, 1, 4301);
    			attr_dev(line23, "id", "XMLID_42_");
    			attr_dev(line23, "class", "st5 svelte-1mi792v");
    			attr_dev(line23, "x1", "1426.62");
    			attr_dev(line23, "y1", "1350.4");
    			attr_dev(line23, "x2", "1398.18");
    			attr_dev(line23, "y2", "1307.43");
    			add_location(line23, file, 57, 1, 4388);
    			attr_dev(path1, "id", "XMLID_43_");
    			attr_dev(path1, "class", "st5 svelte-1mi792v");
    			attr_dev(path1, "d", "M1398.18,1307.43l-34.2,41.74L1398.18,1307.43z");
    			add_location(path1, file, 58, 1, 4475);
    			attr_dev(line24, "id", "XMLID_45_");
    			attr_dev(line24, "class", "st5 svelte-1mi792v");
    			attr_dev(line24, "x1", "1945.96");
    			attr_dev(line24, "y1", "1380");
    			attr_dev(line24, "x2", "1945.96");
    			attr_dev(line24, "y2", line24_y__value = 1535 + /*t*/ ctx[0] * 760);
    			add_location(line24, file, 59, 1, 4561);
    			attr_dev(line25, "id", "XMLID_44_");
    			attr_dev(line25, "class", "st5 svelte-1mi792v");
    			attr_dev(line25, "x1", "1929.96");
    			attr_dev(line25, "y1", "1380");
    			attr_dev(line25, "x2", "1929.96");
    			attr_dev(line25, "y2", line25_y__value = 1535 + /*t*/ ctx[0] * 760);
    			add_location(line25, file, 60, 1, 4653);
    			attr_dev(path2, "id", "XMLID_46_");
    			attr_dev(path2, "class", "st5 svelte-1mi792v");
    			attr_dev(path2, "style", path2_style_value = `transform: translate3d(0, ${/*t*/ ctx[0] * 760}px, 0)`);
    			attr_dev(path2, "d", "M1935.33,1585.95c-0.35,7.28-2.56,11.8-4.57,14.61c-2.19,3.07-4.59,4.74-5.3,8.58\n\t\tc-0.13,0.71-0.91,4.98,1.64,8.03c3.19,3.82,10.66,4.66,14.79,0.37c3.04-3.16,3.57-8.35,1.1-12.6");
    			add_location(path2, file, 61, 1, 4745);
    			attr_dev(line26, "id", "XMLID_47_");
    			attr_dev(line26, "class", "st5 svelte-1mi792v");
    			attr_dev(line26, "x1", "1256.96");
    			attr_dev(line26, "y1", "1330");
    			attr_dev(line26, "x2", "886.96");
    			attr_dev(line26, "y2", "1330");
    			add_location(line26, file, 63, 1, 5012);
    			attr_dev(line27, "id", "XMLID_48_");
    			attr_dev(line27, "class", "st5 svelte-1mi792v");
    			attr_dev(line27, "x1", "1185.96");
    			attr_dev(line27, "y1", "1299");
    			attr_dev(line27, "x2", "1185.96");
    			attr_dev(line27, "y2", "1359");
    			add_location(line27, file, 64, 1, 5093);
    			attr_dev(line28, "id", "XMLID_49_");
    			attr_dev(line28, "class", "st5 svelte-1mi792v");
    			attr_dev(line28, "x1", "1132.96");
    			attr_dev(line28, "y1", "1299");
    			attr_dev(line28, "x2", "1132.96");
    			attr_dev(line28, "y2", "1357");
    			add_location(line28, file, 65, 1, 5175);
    			attr_dev(line29, "id", "XMLID_50_");
    			attr_dev(line29, "class", "st5 svelte-1mi792v");
    			attr_dev(line29, "x1", "1089.96");
    			attr_dev(line29, "y1", "1299");
    			attr_dev(line29, "x2", "1089.96");
    			attr_dev(line29, "y2", "1357");
    			add_location(line29, file, 66, 1, 5257);
    			attr_dev(line30, "id", "XMLID_51_");
    			attr_dev(line30, "class", "st5 svelte-1mi792v");
    			attr_dev(line30, "x1", "1035.96");
    			attr_dev(line30, "y1", "1299");
    			attr_dev(line30, "x2", "1035.96");
    			attr_dev(line30, "y2", "1364");
    			add_location(line30, file, 67, 1, 5339);
    			attr_dev(line31, "id", "XMLID_52_");
    			attr_dev(line31, "class", "st5 svelte-1mi792v");
    			attr_dev(line31, "x1", "982.96");
    			attr_dev(line31, "y1", "1299");
    			attr_dev(line31, "x2", "982.96");
    			attr_dev(line31, "y2", "1357");
    			add_location(line31, file, 68, 1, 5421);
    			attr_dev(line32, "id", "XMLID_53_");
    			attr_dev(line32, "class", "st5 svelte-1mi792v");
    			attr_dev(line32, "x1", "933.96");
    			attr_dev(line32, "y1", "1299");
    			attr_dev(line32, "x2", "933.96");
    			attr_dev(line32, "y2", "1359");
    			add_location(line32, file, 69, 1, 5501);
    			attr_dev(line33, "id", "XMLID_54_");
    			attr_dev(line33, "class", "st5 svelte-1mi792v");
    			attr_dev(line33, "x1", "1342.96");
    			attr_dev(line33, "y1", "2254");
    			attr_dev(line33, "x2", "1272.96");
    			attr_dev(line33, "y2", "2254");
    			add_location(line33, file, 70, 1, 5581);
    			attr_dev(line34, "id", "XMLID_55_");
    			attr_dev(line34, "class", "st5 svelte-1mi792v");
    			attr_dev(line34, "x1", "1345.45");
    			attr_dev(line34, "y1", "2246.69");
    			attr_dev(line34, "x2", "1272.41");
    			attr_dev(line34, "y2", "2211.73");
    			add_location(line34, file, 71, 1, 5663);
    			attr_dev(line35, "id", "XMLID_56_");
    			attr_dev(line35, "class", "st5 svelte-1mi792v");
    			attr_dev(line35, "x1", "1272.96");
    			attr_dev(line35, "y1", "2217");
    			attr_dev(line35, "x2", "1342.96");
    			attr_dev(line35, "y2", "2217");
    			add_location(line35, file, 72, 1, 5751);
    			attr_dev(line36, "id", "XMLID_57_");
    			attr_dev(line36, "class", "st5 svelte-1mi792v");
    			attr_dev(line36, "x1", "1272.41");
    			attr_dev(line36, "y1", "2211.73");
    			attr_dev(line36, "x2", "1344.84");
    			attr_dev(line36, "y2", "2173.44");
    			add_location(line36, file, 73, 1, 5833);
    			attr_dev(line37, "id", "XMLID_58_");
    			attr_dev(line37, "class", "st5 svelte-1mi792v");
    			attr_dev(line37, "x1", "1342.96");
    			attr_dev(line37, "y1", "2185");
    			attr_dev(line37, "x2", "1272.96");
    			attr_dev(line37, "y2", "2185");
    			add_location(line37, file, 74, 1, 5921);
    			attr_dev(line38, "id", "XMLID_59_");
    			attr_dev(line38, "class", "st5 svelte-1mi792v");
    			attr_dev(line38, "x1", "1345.45");
    			attr_dev(line38, "y1", "2176.78");
    			attr_dev(line38, "x2", "1272.41");
    			attr_dev(line38, "y2", "2130.21");
    			add_location(line38, file, 75, 1, 6003);
    			attr_dev(line39, "id", "XMLID_60_");
    			attr_dev(line39, "class", "st5 svelte-1mi792v");
    			attr_dev(line39, "x1", "1272.96");
    			attr_dev(line39, "y1", "2142");
    			attr_dev(line39, "x2", "1342.96");
    			attr_dev(line39, "y2", "2142");
    			add_location(line39, file, 76, 1, 6091);
    			attr_dev(line40, "id", "XMLID_61_");
    			attr_dev(line40, "class", "st5 svelte-1mi792v");
    			attr_dev(line40, "x1", "1275.54");
    			attr_dev(line40, "y1", "2133.08");
    			attr_dev(line40, "x2", "1344.84");
    			attr_dev(line40, "y2", "2091.92");
    			add_location(line40, file, 77, 1, 6173);
    			attr_dev(line41, "id", "XMLID_62_");
    			attr_dev(line41, "class", "st5 svelte-1mi792v");
    			attr_dev(line41, "x1", "1342.96");
    			attr_dev(line41, "y1", "2094");
    			attr_dev(line41, "x2", "1272.96");
    			attr_dev(line41, "y2", "2094");
    			add_location(line41, file, 78, 1, 6261);
    			attr_dev(line42, "id", "XMLID_63_");
    			attr_dev(line42, "class", "st5 svelte-1mi792v");
    			attr_dev(line42, "x1", "1345.45");
    			attr_dev(line42, "y1", "2089.38");
    			attr_dev(line42, "x2", "1272.41");
    			attr_dev(line42, "y2", "2051.79");
    			add_location(line42, file, 79, 1, 6343);
    			attr_dev(line43, "id", "XMLID_64_");
    			attr_dev(line43, "class", "st5 svelte-1mi792v");
    			attr_dev(line43, "x1", "1272.96");
    			attr_dev(line43, "y1", "2061");
    			attr_dev(line43, "x2", "1342.96");
    			attr_dev(line43, "y2", "2061");
    			add_location(line43, file, 80, 1, 6431);
    			attr_dev(line44, "id", "XMLID_65_");
    			attr_dev(line44, "class", "st5 svelte-1mi792v");
    			attr_dev(line44, "x1", "1275.54");
    			attr_dev(line44, "y1", "2054.42");
    			attr_dev(line44, "x2", "1345.45");
    			attr_dev(line44, "y2", "2009.18");
    			add_location(line44, file, 81, 1, 6513);
    			attr_dev(line45, "id", "XMLID_66_");
    			attr_dev(line45, "class", "st5 svelte-1mi792v");
    			attr_dev(line45, "x1", "1342.96");
    			attr_dev(line45, "y1", "2019");
    			attr_dev(line45, "x2", "1272.96");
    			attr_dev(line45, "y2", "2019");
    			add_location(line45, file, 82, 1, 6601);
    			attr_dev(line46, "id", "XMLID_67_");
    			attr_dev(line46, "class", "st5 svelte-1mi792v");
    			attr_dev(line46, "x1", "1345.45");
    			attr_dev(line46, "y1", "2010.72");
    			attr_dev(line46, "x2", "1272.41");
    			attr_dev(line46, "y2", "1968.42");
    			add_location(line46, file, 83, 1, 6683);
    			attr_dev(line47, "id", "XMLID_68_");
    			attr_dev(line47, "class", "st5 svelte-1mi792v");
    			attr_dev(line47, "x1", "1272.96");
    			attr_dev(line47, "y1", "1976");
    			attr_dev(line47, "x2", "1342.96");
    			attr_dev(line47, "y2", "1976");
    			add_location(line47, file, 84, 1, 6771);
    			attr_dev(line48, "id", "XMLID_69_");
    			attr_dev(line48, "class", "st5 svelte-1mi792v");
    			attr_dev(line48, "x1", "1275.54");
    			attr_dev(line48, "y1", "1967.02");
    			attr_dev(line48, "x2", "1344.84");
    			attr_dev(line48, "y2", "1929.51");
    			add_location(line48, file, 85, 1, 6853);
    			attr_dev(line49, "id", "XMLID_70_");
    			attr_dev(line49, "class", "st5 svelte-1mi792v");
    			attr_dev(line49, "x1", "1342.96");
    			attr_dev(line49, "y1", "1938");
    			attr_dev(line49, "x2", "1272.96");
    			attr_dev(line49, "y2", "1938");
    			add_location(line49, file, 86, 1, 6941);
    			attr_dev(line50, "id", "XMLID_71_");
    			attr_dev(line50, "class", "st5 svelte-1mi792v");
    			attr_dev(line50, "x1", "1345.45");
    			attr_dev(line50, "y1", "1932.06");
    			attr_dev(line50, "x2", "1272.41");
    			attr_dev(line50, "y2", "1890.61");
    			add_location(line50, file, 87, 1, 7023);
    			attr_dev(line51, "id", "XMLID_72_");
    			attr_dev(line51, "class", "st5 svelte-1mi792v");
    			attr_dev(line51, "x1", "1272.96");
    			attr_dev(line51, "y1", "1895");
    			attr_dev(line51, "x2", "1342.96");
    			attr_dev(line51, "y2", "1895");
    			add_location(line51, file, 88, 1, 7111);
    			attr_dev(line52, "id", "XMLID_73_");
    			attr_dev(line52, "class", "st5 svelte-1mi792v");
    			attr_dev(line52, "x1", "1275.54");
    			attr_dev(line52, "y1", "1888.37");
    			attr_dev(line52, "x2", "1344.84");
    			attr_dev(line52, "y2", "1849.85");
    			add_location(line52, file, 89, 1, 7193);
    			attr_dev(line53, "id", "XMLID_74_");
    			attr_dev(line53, "class", "st5 svelte-1mi792v");
    			attr_dev(line53, "x1", "1342.96");
    			attr_dev(line53, "y1", "1858");
    			attr_dev(line53, "x2", "1272.96");
    			attr_dev(line53, "y2", "1858");
    			add_location(line53, file, 90, 1, 7281);
    			attr_dev(line54, "id", "XMLID_75_");
    			attr_dev(line54, "class", "st5 svelte-1mi792v");
    			attr_dev(line54, "x1", "1345.45");
    			attr_dev(line54, "y1", "1853.41");
    			attr_dev(line54, "x2", "1272.41");
    			attr_dev(line54, "y2", "1809.71");
    			add_location(line54, file, 91, 1, 7363);
    			attr_dev(line55, "id", "XMLID_76_");
    			attr_dev(line55, "class", "st5 svelte-1mi792v");
    			attr_dev(line55, "x1", "1272.96");
    			attr_dev(line55, "y1", "1815");
    			attr_dev(line55, "x2", "1342.96");
    			attr_dev(line55, "y2", "1815");
    			add_location(line55, file, 92, 1, 7451);
    			attr_dev(line56, "id", "XMLID_77_");
    			attr_dev(line56, "class", "st5 svelte-1mi792v");
    			attr_dev(line56, "x1", "1275.54");
    			attr_dev(line56, "y1", "1809.71");
    			attr_dev(line56, "x2", "1341.84");
    			attr_dev(line56, "y2", "1767.72");
    			add_location(line56, file, 93, 1, 7533);
    			attr_dev(line57, "id", "XMLID_78_");
    			attr_dev(line57, "class", "st5 svelte-1mi792v");
    			attr_dev(line57, "x1", "1342.96");
    			attr_dev(line57, "y1", "1772");
    			attr_dev(line57, "x2", "1272.96");
    			attr_dev(line57, "y2", "1772");
    			add_location(line57, file, 94, 1, 7621);
    			attr_dev(line58, "id", "XMLID_79_");
    			attr_dev(line58, "class", "st5 svelte-1mi792v");
    			attr_dev(line58, "x1", "1345.45");
    			attr_dev(line58, "y1", "1766.01");
    			attr_dev(line58, "x2", "1272.41");
    			attr_dev(line58, "y2", "1725.73");
    			add_location(line58, file, 95, 1, 7703);
    			attr_dev(line59, "id", "XMLID_80_");
    			attr_dev(line59, "class", "st5 svelte-1mi792v");
    			attr_dev(line59, "x1", "1272.96");
    			attr_dev(line59, "y1", "1729");
    			attr_dev(line59, "x2", "1342.96");
    			attr_dev(line59, "y2", "1729");
    			add_location(line59, file, 96, 1, 7791);
    			attr_dev(line60, "id", "XMLID_81_");
    			attr_dev(line60, "class", "st5 svelte-1mi792v");
    			attr_dev(line60, "x1", "1275.54");
    			attr_dev(line60, "y1", "1722.31");
    			attr_dev(line60, "x2", "1341.84");
    			attr_dev(line60, "y2", "1688.06");
    			add_location(line60, file, 97, 1, 7873);
    			attr_dev(line61, "id", "XMLID_82_");
    			attr_dev(line61, "class", "st5 svelte-1mi792v");
    			attr_dev(line61, "x1", "1342.96");
    			attr_dev(line61, "y1", "1691");
    			attr_dev(line61, "x2", "1272.96");
    			attr_dev(line61, "y2", "1691");
    			add_location(line61, file, 98, 1, 7961);
    			attr_dev(line62, "id", "XMLID_83_");
    			attr_dev(line62, "class", "st5 svelte-1mi792v");
    			attr_dev(line62, "x1", "1345.45");
    			attr_dev(line62, "y1", "1687.35");
    			attr_dev(line62, "x2", "1272.41");
    			attr_dev(line62, "y2", "1647.3");
    			add_location(line62, file, 99, 1, 8043);
    			attr_dev(line63, "id", "XMLID_84_");
    			attr_dev(line63, "class", "st5 svelte-1mi792v");
    			attr_dev(line63, "x1", "1272.96");
    			attr_dev(line63, "y1", "1649");
    			attr_dev(line63, "x2", "1342.96");
    			attr_dev(line63, "y2", "1649");
    			add_location(line63, file, 100, 1, 8130);
    			attr_dev(line64, "id", "XMLID_85_");
    			attr_dev(line64, "class", "st5 svelte-1mi792v");
    			attr_dev(line64, "x1", "1275.54");
    			attr_dev(line64, "y1", "1643.65");
    			attr_dev(line64, "x2", "1344.84");
    			attr_dev(line64, "y2", "1604.69");
    			add_location(line64, file, 101, 1, 8212);
    			attr_dev(line65, "id", "XMLID_86_");
    			attr_dev(line65, "class", "st5 svelte-1mi792v");
    			attr_dev(line65, "x1", "1342.96");
    			attr_dev(line65, "y1", "1616");
    			attr_dev(line65, "x2", "1272.96");
    			attr_dev(line65, "y2", "1616");
    			add_location(line65, file, 102, 1, 8300);
    			attr_dev(line66, "id", "XMLID_88_");
    			attr_dev(line66, "class", "st5 svelte-1mi792v");
    			attr_dev(line66, "x1", "1345.45");
    			attr_dev(line66, "y1", "1608.69");
    			attr_dev(line66, "x2", "1272.41");
    			attr_dev(line66, "y2", "1567.02");
    			add_location(line66, file, 103, 1, 8382);
    			attr_dev(line67, "id", "XMLID_89_");
    			attr_dev(line67, "class", "st5 svelte-1mi792v");
    			attr_dev(line67, "x1", "1272.96");
    			attr_dev(line67, "y1", "1574");
    			attr_dev(line67, "x2", "1342.96");
    			attr_dev(line67, "y2", "1574");
    			add_location(line67, file, 104, 1, 8470);
    			attr_dev(line68, "id", "XMLID_90_");
    			attr_dev(line68, "class", "st5 svelte-1mi792v");
    			attr_dev(line68, "x1", "1275.54");
    			attr_dev(line68, "y1", "1565");
    			attr_dev(line68, "x2", "1344.84");
    			attr_dev(line68, "y2", "1524.8");
    			add_location(line68, file, 105, 1, 8552);
    			attr_dev(line69, "id", "XMLID_91_");
    			attr_dev(line69, "class", "st5 svelte-1mi792v");
    			attr_dev(line69, "x1", "1281.11");
    			attr_dev(line69, "y1", "1390.94");
    			attr_dev(line69, "x2", "1335.8");
    			attr_dev(line69, "y2", "1349.17");
    			add_location(line69, file, 106, 1, 8636);
    			attr_dev(line70, "id", "XMLID_92_");
    			attr_dev(line70, "class", "st5 svelte-1mi792v");
    			attr_dev(line70, "x1", "1335.8");
    			attr_dev(line70, "y1", "1349.17");
    			attr_dev(line70, "x2", "1288.19");
    			attr_dev(line70, "y2", "1296.59");
    			add_location(line70, file, 107, 1, 8723);
    			attr_dev(line71, "id", "XMLID_93_");
    			attr_dev(line71, "class", "st5 svelte-1mi792v");
    			attr_dev(line71, "x1", "1288.19");
    			attr_dev(line71, "y1", "1296.59");
    			attr_dev(line71, "x2", "1325.37");
    			attr_dev(line71, "y2", "1251.89");
    			add_location(line71, file, 108, 1, 8810);
    			attr_dev(line72, "id", "XMLID_94_");
    			attr_dev(line72, "class", "st5 svelte-1mi792v");
    			attr_dev(line72, "x1", "1325.37");
    			attr_dev(line72, "y1", "1251.89");
    			attr_dev(line72, "x2", "1294.35");
    			attr_dev(line72, "y2", "1214.46");
    			add_location(line72, file, 109, 1, 8898);
    			attr_dev(line73, "id", "XMLID_95_");
    			attr_dev(line73, "class", "st5 svelte-1mi792v");
    			attr_dev(line73, "x1", "1294.35");
    			attr_dev(line73, "y1", "1214.46");
    			attr_dev(line73, "x2", "1320.64");
    			attr_dev(line73, "y2", "1188.86");
    			add_location(line73, file, 110, 1, 8986);
    			attr_dev(line74, "id", "XMLID_96_");
    			attr_dev(line74, "class", "st5 svelte-1mi792v");
    			attr_dev(line74, "x1", "1320.64");
    			attr_dev(line74, "y1", "1188.86");
    			attr_dev(line74, "x2", "1298.13");
    			attr_dev(line74, "y2", "1164.09");
    			add_location(line74, file, 111, 1, 9074);
    			attr_dev(line75, "id", "XMLID_97_");
    			attr_dev(line75, "class", "st5 svelte-1mi792v");
    			attr_dev(line75, "x1", "1298.13");
    			attr_dev(line75, "y1", "1164.09");
    			attr_dev(line75, "x2", "1317.22");
    			attr_dev(line75, "y2", "1143.39");
    			add_location(line75, file, 112, 1, 9162);
    			attr_dev(path3, "id", "XMLID_106_");
    			attr_dev(path3, "class", "st6 svelte-1mi792v");
    			attr_dev(path3, "d", "M3520.56,613.63");
    			add_location(path3, file, 114, 2, 9298);
    			attr_dev(path4, "id", "XMLID_101_");
    			attr_dev(path4, "class", "st7 svelte-1mi792v");
    			attr_dev(path4, "d", "M2995.73,795.65c86.01-32.49,172.06-64.94,258.14-97.34c86.76-32.66,173.53-65.27,260.3-97.82\n\t\t\tc0.03-0.02,0.05-0.03,0.08-0.05c-4.13-10.57-8.29-21.14-12.42-31.71c-189.68,71.67-379.36,143.34-569.04,215.01\n\t\t\tc0.07,0.02,0.13,0.03,0.2,0.05c20.73,4.02,41.46,8.03,62.19,12.05C2995.36,795.78,2995.55,795.71,2995.73,795.65z");
    			add_location(path4, file, 115, 2, 9356);
    			attr_dev(path5, "id", "XMLID_98_");
    			attr_dev(path5, "class", "st7 svelte-1mi792v");
    			attr_dev(path5, "d", "M3545.91,675.81c-1.26,11.69-5.11,32.9-18.89,55.22c-15.69,25.41-36.07,39.04-46.5,45.05\n\t\t\tc-90.75,34.98-181.51,69.96-272.26,104.95c-0.12-0.02-0.24-0.05-0.37-0.07c-13.97-3.11-46.85-12.45-75.57-41.74\n\t\t\tc-21.22-21.64-30.92-44.74-35.34-57.95c140.87-55.6,281.75-111.19,422.62-166.79c0.35-0.13,0.71-0.26,1.06-0.39\n\t\t\tc8.46,20.87,16.91,41.75,25.37,62.62");
    			add_location(path5, file, 118, 2, 9713);
    			attr_dev(path6, "id", "XMLID_103_");
    			attr_dev(path6, "class", "st7 svelte-1mi792v");
    			attr_dev(path6, "d", "M3040.48,804.51l41.16-15.58c4.75,13.64,14.68,36.31,35.34,57.95\n\t\t\tc27.59,28.9,58.86,39.75,73.5,43.82l-105.08,38.03L3040.48,804.51z");
    			add_location(path6, file, 122, 2, 10101);
    			attr_dev(rect9, "id", "XMLID_99_");
    			attr_dev(rect9, "x", "3035.1");
    			attr_dev(rect9, "y", "833.77");
    			attr_dev(rect9, "transform", "matrix(0.9374 -0.3482 0.3482 0.9374 -112.3799 1114.1121)");
    			attr_dev(rect9, "class", "st7 svelte-1mi792v");
    			attr_dev(rect9, "width", "16.8");
    			attr_dev(rect9, "height", "71.89");
    			add_location(rect9, file, 125, 3, 10278);
    			attr_dev(rect10, "id", "XMLID_100_");
    			attr_dev(rect10, "x", "2998.8");
    			attr_dev(rect10, "y", "834.37");
    			attr_dev(rect10, "transform", "matrix(0.9374 -0.3482 0.3482 0.9374 -118.656 1103.5922)");
    			attr_dev(rect10, "class", "st7 svelte-1mi792v");
    			attr_dev(rect10, "width", "24.6");
    			attr_dev(rect10, "height", "95.1");
    			add_location(rect10, file, 127, 3, 10438);
    			attr_dev(path7, "id", "XMLID_104_");
    			attr_dev(path7, "class", "st7 svelte-1mi792v");
    			attr_dev(path7, "d", "M3360.85,819.49l-70.71,25.18l8.19,23c12.33-4.39,24.66-8.78,36.99-13.17\n\t\t\tc11.24-4,22.48-8,33.72-12.01C3366.31,834.83,3363.58,827.16,3360.85,819.49z");
    			add_location(path7, file, 128, 2, 10593);
    			attr_dev(circle, "id", "XMLID_156_");
    			attr_dev(circle, "class", "st9 svelte-1mi792v");
    			attr_dev(circle, "cx", "3140");
    			attr_dev(circle, "cy", "802.38");
    			attr_dev(circle, "r", "9.83");
    			add_location(circle, file, 130, 2, 10784);
    			attr_dev(g, "transform", g_transform_value = `rotate(${/*t*/ ctx[0] * -45} 3320 850)`);
    			add_location(g, file, 113, 1, 9250);
    			attr_dev(path8, "id", "XMLID_105_");
    			attr_dev(path8, "class", "st7 svelte-1mi792v");
    			attr_dev(path8, "d", "M3627.24,1023.11h-43.31c0-24.57,0-49.15,0-73.72c0-24.31,0-48.63,0-72.94\n\t\t\tc14.44,0,28.87,0,43.31,0V1023.11z");
    			add_location(path8, file, 133, 1, 10862);
    			attr_dev(path9, "id", "XMLID_107_");
    			attr_dev(path9, "class", "st8 svelte-1mi792v");
    			attr_dev(path9, "d", "M 3324.62 831.62 C 3338.9 863.33 3345.67 880.47 3355.57 900.51 C 3365.3 920.2 3370.21 930.03 3375.75 936.21 C 3392.17 954.52 3417.6 956.55 3480.3 955.79 C 3513.17 955.39 3551.17 954.29 3593.48 951.89");
    			add_location(path9, file, 135, 1, 11012);
    			attr_dev(rect11, "id", "XMLID_155_");
    			attr_dev(rect11, "x", "3627.24");
    			attr_dev(rect11, "y", "747.55");
    			attr_dev(rect11, "class", "st7 svelte-1mi792v");
    			attr_dev(rect11, "width", "134.89");
    			attr_dev(rect11, "height", "1730.13");
    			add_location(rect11, file, 136, 1, 11253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, rect1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, rect2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, path0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, polyline, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, rect3, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, rect4, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, rect5, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, rect6, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, rect7, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, rect8, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, line0, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, line1, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, line2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, line3, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, line4, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, line5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, line6, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, line7, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, line8, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, polygon, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, line9, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, line10, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, line11, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, line12, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, line13, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, line14, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, line15, anchor);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, line16, anchor);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, line17, anchor);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, line18, anchor);
    			insert_dev(target, t30, anchor);
    			insert_dev(target, line19, anchor);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, line20, anchor);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, line21, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, line22, anchor);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, line23, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, path1, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, line24, anchor);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, line25, anchor);
    			insert_dev(target, t38, anchor);
    			insert_dev(target, path2, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, line26, anchor);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, line27, anchor);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, line28, anchor);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, line29, anchor);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, line30, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, line31, anchor);
    			insert_dev(target, t45, anchor);
    			insert_dev(target, line32, anchor);
    			insert_dev(target, t46, anchor);
    			insert_dev(target, line33, anchor);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, line34, anchor);
    			insert_dev(target, t48, anchor);
    			insert_dev(target, line35, anchor);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, line36, anchor);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, line37, anchor);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, line38, anchor);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, line39, anchor);
    			insert_dev(target, t53, anchor);
    			insert_dev(target, line40, anchor);
    			insert_dev(target, t54, anchor);
    			insert_dev(target, line41, anchor);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, line42, anchor);
    			insert_dev(target, t56, anchor);
    			insert_dev(target, line43, anchor);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, line44, anchor);
    			insert_dev(target, t58, anchor);
    			insert_dev(target, line45, anchor);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, line46, anchor);
    			insert_dev(target, t60, anchor);
    			insert_dev(target, line47, anchor);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, line48, anchor);
    			insert_dev(target, t62, anchor);
    			insert_dev(target, line49, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, line50, anchor);
    			insert_dev(target, t64, anchor);
    			insert_dev(target, line51, anchor);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, line52, anchor);
    			insert_dev(target, t66, anchor);
    			insert_dev(target, line53, anchor);
    			insert_dev(target, t67, anchor);
    			insert_dev(target, line54, anchor);
    			insert_dev(target, t68, anchor);
    			insert_dev(target, line55, anchor);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, line56, anchor);
    			insert_dev(target, t70, anchor);
    			insert_dev(target, line57, anchor);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, line58, anchor);
    			insert_dev(target, t72, anchor);
    			insert_dev(target, line59, anchor);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, line60, anchor);
    			insert_dev(target, t74, anchor);
    			insert_dev(target, line61, anchor);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, line62, anchor);
    			insert_dev(target, t76, anchor);
    			insert_dev(target, line63, anchor);
    			insert_dev(target, t77, anchor);
    			insert_dev(target, line64, anchor);
    			insert_dev(target, t78, anchor);
    			insert_dev(target, line65, anchor);
    			insert_dev(target, t79, anchor);
    			insert_dev(target, line66, anchor);
    			insert_dev(target, t80, anchor);
    			insert_dev(target, line67, anchor);
    			insert_dev(target, t81, anchor);
    			insert_dev(target, line68, anchor);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, line69, anchor);
    			insert_dev(target, t83, anchor);
    			insert_dev(target, line70, anchor);
    			insert_dev(target, t84, anchor);
    			insert_dev(target, line71, anchor);
    			insert_dev(target, t85, anchor);
    			insert_dev(target, line72, anchor);
    			insert_dev(target, t86, anchor);
    			insert_dev(target, line73, anchor);
    			insert_dev(target, t87, anchor);
    			insert_dev(target, line74, anchor);
    			insert_dev(target, t88, anchor);
    			insert_dev(target, line75, anchor);
    			insert_dev(target, t89, anchor);
    			insert_dev(target, g, anchor);
    			append_dev(g, path3);
    			append_dev(g, path4);
    			append_dev(g, path5);
    			append_dev(g, path6);
    			append_dev(g, rect9);
    			append_dev(g, rect10);
    			append_dev(g, path7);
    			append_dev(g, circle);
    			insert_dev(target, t90, anchor);
    			insert_dev(target, path8, anchor);
    			insert_dev(target, t91, anchor);
    			insert_dev(target, path9, anchor);
    			insert_dev(target, t92, anchor);
    			insert_dev(target, rect11, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*t*/ 1 && rect8_transform_value !== (rect8_transform_value = `matrix(-1 -4.488111e-11 4.488111e-11 -1 3876.1985 3118.999) translate(0, ${-/*t*/ ctx[0] * 760})`)) {
    				attr_dev(rect8, "transform", rect8_transform_value);
    			}

    			if (dirty & /*t*/ 1 && line24_y__value !== (line24_y__value = 1535 + /*t*/ ctx[0] * 760)) {
    				attr_dev(line24, "y2", line24_y__value);
    			}

    			if (dirty & /*t*/ 1 && line25_y__value !== (line25_y__value = 1535 + /*t*/ ctx[0] * 760)) {
    				attr_dev(line25, "y2", line25_y__value);
    			}

    			if (dirty & /*t*/ 1 && path2_style_value !== (path2_style_value = `transform: translate3d(0, ${/*t*/ ctx[0] * 760}px, 0)`)) {
    				attr_dev(path2, "style", path2_style_value);
    			}

    			if (dirty & /*t*/ 1 && g_transform_value !== (g_transform_value = `rotate(${/*t*/ ctx[0] * -45} 3320 850)`)) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(rect1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(rect2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(polyline);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(rect3);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(rect4);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(rect5);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(rect6);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(rect7);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(rect8);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(line1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(line2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(line3);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(line4);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(line5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(line6);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(line7);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(line8);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(polygon);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(line9);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(line10);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(line11);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(line12);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(line13);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(line14);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(line15);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(line16);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(line17);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(line18);
    			if (detaching) detach_dev(t30);
    			if (detaching) detach_dev(line19);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(line20);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(line21);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(line22);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(line23);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(path1);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(line24);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(line25);
    			if (detaching) detach_dev(t38);
    			if (detaching) detach_dev(path2);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(line26);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(line27);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(line28);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(line29);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(line30);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(line31);
    			if (detaching) detach_dev(t45);
    			if (detaching) detach_dev(line32);
    			if (detaching) detach_dev(t46);
    			if (detaching) detach_dev(line33);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(line34);
    			if (detaching) detach_dev(t48);
    			if (detaching) detach_dev(line35);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(line36);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(line37);
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(line38);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(line39);
    			if (detaching) detach_dev(t53);
    			if (detaching) detach_dev(line40);
    			if (detaching) detach_dev(t54);
    			if (detaching) detach_dev(line41);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(line42);
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(line43);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(line44);
    			if (detaching) detach_dev(t58);
    			if (detaching) detach_dev(line45);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(line46);
    			if (detaching) detach_dev(t60);
    			if (detaching) detach_dev(line47);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(line48);
    			if (detaching) detach_dev(t62);
    			if (detaching) detach_dev(line49);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(line50);
    			if (detaching) detach_dev(t64);
    			if (detaching) detach_dev(line51);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(line52);
    			if (detaching) detach_dev(t66);
    			if (detaching) detach_dev(line53);
    			if (detaching) detach_dev(t67);
    			if (detaching) detach_dev(line54);
    			if (detaching) detach_dev(t68);
    			if (detaching) detach_dev(line55);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(line56);
    			if (detaching) detach_dev(t70);
    			if (detaching) detach_dev(line57);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(line58);
    			if (detaching) detach_dev(t72);
    			if (detaching) detach_dev(line59);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(line60);
    			if (detaching) detach_dev(t74);
    			if (detaching) detach_dev(line61);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(line62);
    			if (detaching) detach_dev(t76);
    			if (detaching) detach_dev(line63);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(line64);
    			if (detaching) detach_dev(t78);
    			if (detaching) detach_dev(line65);
    			if (detaching) detach_dev(t79);
    			if (detaching) detach_dev(line66);
    			if (detaching) detach_dev(t80);
    			if (detaching) detach_dev(line67);
    			if (detaching) detach_dev(t81);
    			if (detaching) detach_dev(line68);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(line69);
    			if (detaching) detach_dev(t83);
    			if (detaching) detach_dev(line70);
    			if (detaching) detach_dev(t84);
    			if (detaching) detach_dev(line71);
    			if (detaching) detach_dev(t85);
    			if (detaching) detach_dev(line72);
    			if (detaching) detach_dev(t86);
    			if (detaching) detach_dev(line73);
    			if (detaching) detach_dev(t87);
    			if (detaching) detach_dev(line74);
    			if (detaching) detach_dev(t88);
    			if (detaching) detach_dev(line75);
    			if (detaching) detach_dev(t89);
    			if (detaching) detach_dev(g);
    			if (detaching) detach_dev(t90);
    			if (detaching) detach_dev(path8);
    			if (detaching) detach_dev(t91);
    			if (detaching) detach_dev(path9);
    			if (detaching) detach_dev(t92);
    			if (detaching) detach_dev(rect11);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { t } = $$props;
    	const writable_props = ["t"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Extra> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("t" in $$props) $$invalidate(0, t = $$props.t);
    	};

    	$$self.$capture_state = () => {
    		return { t };
    	};

    	$$self.$inject_state = $$props => {
    		if ("t" in $$props) $$invalidate(0, t = $$props.t);
    	};

    	return [t];
    }

    class Extra extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { t: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Extra",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*t*/ ctx[0] === undefined && !("t" in props)) {
    			console.warn("<Extra> was created without expected prop 't'");
    		}
    	}

    	get t() {
    		throw new Error("<Extra>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set t(value) {
    		throw new Error("<Extra>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/layer.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/components/layer.svelte";

    // (81:0) {#if depth === 0}
    function create_if_block(ctx) {
    	let current;

    	const extra = new Extra({
    			props: { t: /*t*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(extra.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(extra, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const extra_changes = {};
    			if (dirty & /*t*/ 4) extra_changes.t = /*t*/ ctx[2];
    			extra.$set(extra_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(extra.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(extra.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(extra, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(81:0) {#if depth === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t_1;
    	let path;
    	let path_class_value;
    	let path_d_value;
    	let current;
    	let if_block = /*depth*/ ctx[0] === 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t_1 = space();
    			path = svg_element("path");
    			attr_dev(path, "class", path_class_value = "" + (null_to_empty(`layer-${/*depth*/ ctx[0]}`) + " svelte-1qbsmg6"));
    			attr_dev(path, "style", /*style*/ ctx[1]);
    			attr_dev(path, "d", path_d_value = /*data*/ ctx[3][/*depth*/ ctx[0]].split(/ |\n/).join("") || "M0,0");
    			add_location(path, file$1, 84, 0, 6681);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, path, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*depth*/ ctx[0] === 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t_1.parentNode, t_1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*depth*/ 1 && path_class_value !== (path_class_value = "" + (null_to_empty(`layer-${/*depth*/ ctx[0]}`) + " svelte-1qbsmg6"))) {
    				attr_dev(path, "class", path_class_value);
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(path, "style", /*style*/ ctx[1]);
    			}

    			if (!current || dirty & /*depth*/ 1 && path_d_value !== (path_d_value = /*data*/ ctx[3][/*depth*/ ctx[0]].split(/ |\n/).join("") || "M0,0")) {
    				attr_dev(path, "d", path_d_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t_1);
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { depth = 1 } = $$props;
    	let { style = "color: black" } = $$props;
    	let { t = 0 } = $$props;

    	const data = [
    		`M2538.96,2479c-846.33-0.19-1692.67-0.19-2539,0v-440h205v140h75v-17h96v-10h59v10h32v17h17v69
		h70v-80h16v-32h97v-97h27v91h43v38h48v-64h43v-54h22v54h70v75h48v-38h64v-27h113v27h44v204h54v-124h48v-32h75v32h32v108.58
		l1.06-0.5l62.94-37.43V2232h82v-225h16v-18.77c19,0.34,38.92,1.94,58.49,2.28c0.14,5.08,0.06,11.49,0.2,16.49h21.3v64h209v145h28
		v32h49v32h37v-64h43v-65.22v6.22h91v27h248v-129h64v-32h27v32h64v172h38.26l0.2-2.46c16.13-11.77,30.85-23.63,46.98-35.39
		l49.55,32.54v79.25l0.05,1.56c8.96-0.25,17.94-0.51,26.9-0.76c-0.01-2.13,0-1.84-0.01-3.97c-0.06-12.09-0.11-22.76-0.16-33.76
		c0.06,0,0.13,0,0.19,0c7.13,0,14.53-3,21.66-3.26c0.03-0.89-0.62-4.21,0.38-5.1v-62.27c-1-0.43-0.34-0.87-0.38-1.3
		c41.71-0.58,83.29-1.16,125.01-1.74c0.06,12.78,0.07,28.22,0.16,41.06c0.09,12.02,0.12,22.61,0.24,38.61c2.97,0,5.93,0,8.9,0
		c-0.01,0-0.02-4.92-0.03-6.06c0.01-46.03,0.02-93.38,0.03-139.41c-0.04-0.04-0.09-0.75-0.13-0.79c26.52-0.13,53.05-0.6,79.57-0.73
		c0-0.96-0.01-2.09-0.01-3.05c-0.01-3.11,0.01-6.34,0.05-9.54c0.04-2.79,0.1-4.59,0.17-7.31c0.94-0.02,1.89,0.9,2.84,0.9h22.11
		c0.93,0,1.86-0.89,2.79-0.83c-0.04,7.19-0.07,14.54-0.11,21.73c0.95-0.02,1.9,0.1,2.84,0.1h22.11c0.75,0,1.5-0.55,2.25-0.49
		c0.11,10.79,0.19,21.31,0.25,32.21c0.05,10.88,0.08,21.55,0.07,32.33c0.99-0.06,1.97-0.2,2.96-0.26
		c16.59,0.02,33.18,0.01,49.77,0.03c0.33-0.03,0.67-0.08,0.67-0.05c0,0.01-0.14,0.01-0.14,0.01c0,10.81,0,21.61,0,32.41
		c6,0.01,4.23-5.18,4.98-0.18h27.64c0.87,0,1.74,0.23,2.61,0.29c-0.13,36-0.25,72.06-0.38,108.06c1.1,0.06,2.2,0.15,3.3,0.21
		c19.61,0.08,39.22,0.16,58.83,0.24c-0.02-2.08-0.04-4.15-0.06-6.23c0.37-8.86,0.73-17.71,1.1-26.57
		c5.02-0.04,10.03-0.09,15.05-0.13c-0.01-2.06-0.01-5.2-0.02-7.26c-0.04-21.02-0.02-41.79,0.07-62.7c2.65-0.03,5.3,0.1,7.95,0.1
		h99.5c0.88,0,1.76-0.13,2.64-0.1c0.12-9.24,0.21-18.61,0.28-27.93c0.08-11.61,0.12-23.19,0.12-34.66
		c5.4,0.08,10.79,0.14,16.19,0.22c0.04,20.87,0.08,41.73,0.11,62.61c0.92-0.16,1.84-0.33,2.77-0.5
		c80.13-0.02,160.25-0.04,240.38-0.06c-0.02-6.22-0.05-12.46-0.09-18.72c-0.04-6.28-0.09-12.54-0.16-18.79
		c1.03-0.02,2.06-0.04,3.09-0.06h38.7c0.72,0,1.43,0,2.15,0c0.23,17.97,0.45,35.94,0.68,53.91c0.9,0.02,1.8-0.01,2.7,0.01
		c11.39,0.09,22.79,0.16,34.18,0.25c0.15-1.5,0.3-3,0.46-4.5c0.08-40.1,0.17-80.21,0.25-120.31c1.27-0.03,2.54-0.06,3.81-0.09
		c19.34,0.08,38.67,0.15,58.01,0.23c0.01-1.24,0.02-2.48,0.03-3.72c-0.08-13.27-0.13-26.59-0.16-39.95
		c-0.03-12.64-0.03-24.23-0.01-36.79c0.98-0.02,1.96,0.95,2.94,0.95h82.92c0.78,0,1.56-0.87,2.33-0.81
		c0.03,12.56,0.08,24.65,0.16,37.27c0.07,12.37,0.16,24.45,0.27,36.75c0.32-0.02,0.64-0.16,0.95-0.17c5.15-0.01,10.3-0.4,15.45-0.41
		c-0.2,14.74-0.15,29.66,0.18,44.82c0.04,1.88,0.09,3.74,0.14,5.62c13.77-0.15,27.55-0.2,41.32-0.35
		c0.29,17.69,0.59,35.39,0.88,53.08c7.96,0.05,15.93,0.1,23.89,0.16c-0.02,16.58-0.04,33.16-0.07,49.74
		c0.98-0.02,1.96-0.06,2.94-0.08c7.85-0.07,15.83-0.09,23.93-0.01c8.38,0.08,16.24,0.24,24.35,0.47c0.04-1.26-0.27-2.52-0.27-3.78
		v-158.5c0-0.13-0.16-0.19-0.17-0.2c0,0-0.28,0.04-0.42,0.14c8.98,0.02,17.85,0.04,26.83,0.06c-0.02,52.05-0.09,104.11-0.11,156.16
		c1.1,0.06,2.17,0.12,3.27,0.18c9.67,0.04,19.33,0.08,29,0.12c0.04-1.21,0.07-2.42,0.1-3.63c-0.06-24.11-0.13-48.22-0.2-72.33
		c1.41-0.08,2.82-0.16,4.24-0.24c27.34-0.09,54.69-0.17,82.03-0.26c0.07-2.14,0.14-4.28,0.21-6.42c0.03-23.04,0.06-45.08,0.09-68.12
		c2.04-0.09,4.08,0.72,6.12,0.72c10.11,0,20.21,0,30.32,0c0.03,0,0.06-3.34,0.09-4.51c-0.03-22.39-0.06-43.96-0.09-66.35
		c0.95,0.01,1.9,0.86,2.85,0.86h82.92c1.7,0,2.55,0,2.55,0s-0.09,0-0.26,0c0.04,11,0.08,24.55,0.13,37.51
		c0.05,12.4,0.1,24.14,0.16,36.52c-0.02,0.05-0.05-0.23-0.07-0.18c21.28-0.03,42.55-0.22,63.83-0.24l-1.34,0.62l23.12-24.52
		l43.07,48.09c0.12,50.09,0.24,100.16,0.37,150.25c10.6,0.06,21.19,0.12,31.79,0.19c-0.01-47.4-0.03-94.81-0.04-142.21
		c2.69,0.01,5.38,0.01,8.07,0.01c8.27,0.04,16.55,0.09,24.82,0.13c0.02-1.14,0.03-2.28,0.05-3.42c0.04-6.3,0.14-19.44,0.18-25.74
		c0.05-7,0.32-20.41,0.38-27.42c30.32,0.09,60.03,0.18,91.12,0.27v0.86c-0.05,130-0.09,260.01-0.14,390.01
    C3786.2,2479.39,3162.58,2479.14,2538.96,2479z`,
    		`M972.96,1830h27v64h32v-136.33l-2.29-1.23l35.83-34.39l37.07,37.95h26.39v-85h76v118h27v101h27v38h48v-102
		h-2.57l10.2-60.29l19.37,57.67V1873h27v29.44l2.12-0.11l23.88,5.47v24.2h22v-97h21v-48h32v-21h16v-102h77v91h32v102h21v-81h27
		v-12.97l-0.83-2.26l39.66-39.49l31.17,31.02V1776h26v86h27v32h32v33h60.06h4.94v-70h33v-59h11v59h27v75h21v-193h16v-22h11v-16h27
		v16h10v22h16v145h27v-49h38v-26h53v32h49v80h49v-43h48v-32h27v16h11v-152.59l1.33-2.44l46.3-46.29l43.37,43.36v166.22v1.29
		l32.32,33.44h79.68v-188h28v-10h27v-43h21v37h27v16h27v76h32v-49h16v38h27v16h27v75h16v32h114v-27h75v22h48v-32h43v-27h48v27h27v64
		h11v-38h59v38h22v-123h38v-156h16v-16h26v-86h11v86h11v21h21v188h65v97h59v-102h32v-29.71l0.69,0.41l32.36-32.1l31.95,31.69V1846
		h38v91h16v-48h37v48h38v-96h43v-86h75v91h16v16h37v54h17v182h43v-139h33v-59h10v-59h11v59h11v112h70v-120.28l-0.89,0.44
		l26.89-27.25V1755h75v91h22.2l-1.35-3.47l48.17-48.47l44.99,44.03v112.6l0.36-0.18l37.64-37.35V1793h91v686h-4410v-692h32v43h11v38
		h37v75h17v-126.35l-0.41,0.6l40.86-39.37l34.88,36.13h32.67v-80h75v96h21v161h70v-118h32v59h38.2h-6.2v129h43v-169.28l-1.06,1.36
    l50.06-49.62V1814h27v-91h75v64h32v129h43v-48h43v48h32v-22h17v22h70v-193h75v37h27v70`,
    		`M1307.51,1112.15c9.91,71.28,19.81,142.57,29.72,213.85h33.72v97h16v48h27v134h135v70h48v37
		h43v-456h43v-75h75V972h11v209h59v67.3v7.7h44v124h118v43h27v316h43v-188h93.72l-0.49-2.98c-7.38-256.12-6.36-525.19,5.62-804.85
		c4.25-99.27,9.76-197.21,16.38-293.15l-0.69-0.48l159.46-43.05V495h45.31l2.5,0.17l26.23-75.49
		c26.09,232.88,44.56,486.02,50.59,754.92c4.03,179.73,2.16,349.41-4.13,516.41h77.49v-113h23v-86h86v70h37v64h32v172h54v-123h59
		v-70h27v70h49v-180.06l1.65,1.87l80.74-80.87l89.61,89.72V1739h0.32l62.57-317.99l38.11,229.42V1471h50v-65h27v65h42v246h81v-150
		h80v-257h98.26l-2.76-3.75l23.51,22.47V1262h43v69h16v386h32v-152.35l-0.58-1.44l72.07-72.22l73.51,73.66V1739h16v-172h162v172h64
		v-509h70v-108h32v108h38v37h48v483h173v729h-4410v-984.06l2.89-2.68l35.11,34.85V1739h21v-86h91v91h60v-161h182v129h11v59h38
		v-120.57V1664h108v-123h37v-118h81v64h123v300h49v-544.06l-1.29,2.51l72.03-71.29l80.26,79.51V1884h53v-354h22v-38h64v43h73.99
    l-8.99-7.89V1460h27v-37h27v-97h30.19c-0.16,0-0.33,0-0.49,0C1287.61,1254.72,1297.56,1183.43,1307.51,1112.15z`
    	];

    	const writable_props = ["depth", "style", "t"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("depth" in $$props) $$invalidate(0, depth = $$props.depth);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("t" in $$props) $$invalidate(2, t = $$props.t);
    	};

    	$$self.$capture_state = () => {
    		return { depth, style, t };
    	};

    	$$self.$inject_state = $$props => {
    		if ("depth" in $$props) $$invalidate(0, depth = $$props.depth);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("t" in $$props) $$invalidate(2, t = $$props.t);
    	};

    	return [depth, style, t, data];
    }

    class Layer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { depth: 0, style: 1, t: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layer",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get depth() {
    		throw new Error("<Layer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set depth(value) {
    		throw new Error("<Layer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Layer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Layer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get t() {
    		throw new Error("<Layer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set t(value) {
    		throw new Error("<Layer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/app.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/app.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (33:2) {#each layers as layer}
    function create_each_block(ctx) {
    	let current;

    	const layer = new Layer({
    			props: {
    				t: (/*y*/ ctx[1] - /*offsetTop*/ ctx[0] + /*wh*/ ctx[3] - /*h*/ ctx[2]) / /*wh*/ ctx[3],
    				depth: /*layer*/ ctx[10],
    				style: "transform: translate(0," + (/*y*/ ctx[1] - /*offsetTop*/ ctx[0] + /*wh*/ ctx[3] - /*h*/ ctx[2]) / /*wh*/ ctx[3] * /*layer*/ ctx[10] * 500 + "px);"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(layer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const layer_changes = {};
    			if (dirty & /*y, offsetTop, wh, h*/ 15) layer_changes.t = (/*y*/ ctx[1] - /*offsetTop*/ ctx[0] + /*wh*/ ctx[3] - /*h*/ ctx[2]) / /*wh*/ ctx[3];
    			if (dirty & /*y, offsetTop, wh, h*/ 15) layer_changes.style = "transform: translate(0," + (/*y*/ ctx[1] - /*offsetTop*/ ctx[0] + /*wh*/ ctx[3] - /*h*/ ctx[2]) / /*wh*/ ctx[3] * /*layer*/ ctx[10] * 500 + "px);";
    			layer.$set(layer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(33:2) {#each layers as layer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let div;
    	let svg;
    	let div_resize_listener;
    	let current;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[6]);
    	add_render_callback(/*onwindowresize*/ ctx[7]);
    	let each_value = /*layers*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(svg, "id", "background");
    			attr_dev(svg, "viewBox", "0 0 4409.92 2479.24");
    			attr_dev(svg, "class", "svelte-1f9h30l");
    			add_location(svg, file$2, 31, 1, 633);
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[8].call(div));
    			add_location(div, file$2, 30, 0, 582);

    			dispose = [
    				listen_dev(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[6]();
    				}),
    				listen_dev(window, "resize", /*onwindowresize*/ ctx[7])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[8].bind(div));
    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 2 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[1]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (dirty & /*y, offsetTop, wh, h, layers*/ 47) {
    				each_value = /*layers*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			div_resize_listener.cancel();
    			/*div_binding*/ ctx[9](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const layers = [2, 1, 0];
    	let offsetTop = 0;
    	let y = 0;
    	let h = 1;
    	let wh = 1;
    	let container;

    	onMount(() => {
    		$$invalidate(0, offsetTop = container.offsetTop);
    		if (offsetTop === 1) $$invalidate(0, offsetTop = container.offsetParent.offsetTop);
    	});

    	function onwindowscroll() {
    		$$invalidate(1, y = window.pageYOffset);
    	}

    	function onwindowresize() {
    		$$invalidate(3, wh = window.innerHeight);
    	}

    	function div_elementresize_handler() {
    		h = this.clientHeight;
    		$$invalidate(2, h);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, container = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("offsetTop" in $$props) $$invalidate(0, offsetTop = $$props.offsetTop);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("h" in $$props) $$invalidate(2, h = $$props.h);
    		if ("wh" in $$props) $$invalidate(3, wh = $$props.wh);
    		if ("container" in $$props) $$invalidate(4, container = $$props.container);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*container, offsetTop*/ 17) {
    			 {
    				if (container) {
    					$$invalidate(0, offsetTop = container.offsetTop);
    					if (offsetTop === 1) $$invalidate(0, offsetTop = container.offsetParent.offsetTop);
    				}
    			}
    		}
    	};

    	return [
    		offsetTop,
    		y,
    		h,
    		wh,
    		container,
    		layers,
    		onwindowscroll,
    		onwindowresize,
    		div_elementresize_handler,
    		div_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
      target: document.querySelector("#parallax-city"),
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
