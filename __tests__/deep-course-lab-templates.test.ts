import { LABS_2 } from "@/lib/deep-courses/labs/advanced-java-2";

describe("Java lab template expressions", () => {
  const jsp = LABS_2["jsp-el-jstl"];

  it.each([
    ["syntax", jsp.syntax.code, '${fn:escapeXml(param.q)}'],
    ["example", jsp.example.code, '${row.index % 2 == 0 ? \'even\' : \'odd\'}'],
    ["simple", jsp.simple.code, '${empty sessionScope.visits ? 1 : sessionScope.visits + 1}'],
    ["moderate", jsp.moderate.code, '${empty cart ? 0 : cart.size()}'],
    ["complex", jsp.complex.code, '${param.name}'],
    ["assignment", jsp.assignments[0].code!, '${s.marks >= 75}'],
    ["Thymeleaf", jsp.alternates[0].code, '${#numbers.formatInteger(p.price, 1, \'COMMA\')}'],
    ["MVC", LABS_2["mvc-pattern"].example.code, '${p.name} - ${p.price}'],
  ])("preserves literal expressions in %s source", (_name, source, expression) => {
    expect(source).toContain(expression);
    expect(source).not.toContain('\\${');
  });

  it("preserves Java string escapes alongside EL expressions", () => {
    expect(jsp.complex.code).toContain('out.write("</p>\\n");');
    expect(jsp.assignments[2].q).toContain('${param.comment}');
  });
});
