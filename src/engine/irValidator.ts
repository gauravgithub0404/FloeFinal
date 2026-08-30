import { IntermediateRepresentation, ValidationResult, ValidationError, ExecutionMode } from '../types/floe';

export function validateIR(ir: IntermediateRepresentation): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const executionModes: Record<ExecutionMode, number> = {
    deterministic: 0,
    ai: 0,
    agentic: 0,
    human: 0
  };

  // 1. Basic Metadata validation
  if (!ir.name || ir.name.trim().length === 0) {
    errors.push({
      type: 'schema',
      severity: 'error',
      message: 'Application name is required.',
      path: 'name'
    });
  }

  if (!ir.domain) {
    errors.push({
      type: 'schema',
      severity: 'error',
      message: 'Domain identifier is required.',
      path: 'domain'
    });
  }

  // 2. Entity validations
  if (!ir.entities || ir.entities.length === 0) {
    errors.push({
      type: 'schema',
      severity: 'error',
      message: 'IR must contain at least one entity definition.',
      path: 'entities'
    });
  }

  const entityNames = new Set<string>();
  ir.entities.forEach((entity, eIdx) => {
    if (!entity.name) {
      errors.push({
        type: 'schema',
        severity: 'error',
        message: `Entity at index ${eIdx} is missing a name.`,
        path: `entities[${eIdx}].name`
      });
    } else {
      entityNames.add(entity.name);
    }

    if (!entity.fields || entity.fields.length === 0) {
      errors.push({
        type: 'schema',
        severity: 'error',
        message: `Entity "${entity.name}" must contain at least one field.`,
        path: `entities[${eIdx}].fields`
      });
    }
  });

  // 3. Referential integrity checks for fields and relationships
  ir.entities.forEach((entity, eIdx) => {
    entity.fields.forEach((field, fIdx) => {
      if (typeof field.type === 'string' && field.type.startsWith('ref:')) {
        const targetEntity = field.type.replace('ref:', '');
        if (!entityNames.has(targetEntity)) {
          errors.push({
            type: 'semantic',
            severity: 'error',
            message: `Field "${field.name}" in entity "${entity.name}" references non-existent entity "${targetEntity}".`,
            path: `entities[${eIdx}].fields[${fIdx}].type`
          });
        }
      }
    });
  });

  ir.relationships.forEach((rel, rIdx) => {
    if (!entityNames.has(rel.from)) {
      errors.push({
        type: 'semantic',
        severity: 'error',
        message: `Relationship specifies non-existent source entity "${rel.from}".`,
        path: `relationships[${rIdx}].from`
      });
    }
    if (!entityNames.has(rel.to)) {
      errors.push({
        type: 'semantic',
        severity: 'error',
        message: `Relationship specifies non-existent target entity "${rel.to}".`,
        path: `relationships[${rIdx}].to`
      });
    }
  });

  // 4. Workflow Graph & Semantic checks
  let totalNodes = 0;

  ir.workflows.forEach((workflow, wIdx) => {
    const nodeIds = new Set<string>();
    const nodeMap = new Map<string, typeof workflow.nodes[0]>();

    workflow.nodes.forEach((node, nIdx) => {
      totalNodes++;
      if (!node.id) {
        errors.push({
          type: 'schema',
          severity: 'error',
          message: `Workflow "${workflow.name}" node at index ${nIdx} has no ID.`,
          path: `workflows[${wIdx}].nodes[${nIdx}].id`
        });
      } else {
        nodeIds.add(node.id);
        nodeMap.set(node.id, node);
      }

      // Count execution mode
      if (node.execution_mode && executionModes[node.execution_mode] !== undefined) {
        executionModes[node.execution_mode]++;
      } else {
        warnings.push({
          type: 'schema',
          severity: 'warning',
          message: `Node "${node.id}" has unspecified or invalid execution_mode. Defaulting to deterministic.`,
          path: `workflows[${wIdx}].nodes[${nIdx}].execution_mode`
        });
      }

      // Human node checks
      if (node.type === 'human' || node.execution_mode === 'human') {
        if (!node.timeout) {
          warnings.push({
            type: 'semantic',
            severity: 'warning',
            message: `Human approval node "${node.id}" (${node.label || node.action}) has no explicit timeout configured. Defaulting to 48h.`,
            path: `workflows[${wIdx}].nodes[${nIdx}].timeout`
          });
        }
        if (!node.on_timeout) {
          warnings.push({
            type: 'semantic',
            severity: 'warning',
            message: `Human approval node "${node.id}" has no fallback escalation defined for on_timeout.`,
            path: `workflows[${wIdx}].nodes[${nIdx}].on_timeout`
          });
        }
      }

      // Condition AST check
      if (node.type === 'condition' && node.expression) {
        const validOps = ['gt', 'lt', 'eq', 'neq', 'gte', 'lte', 'and', 'or', 'in'];
        if (!validOps.includes(node.expression.operator)) {
          errors.push({
            type: 'semantic',
            severity: 'error',
            message: `Condition node "${node.id}" has unsupported AST operator "${node.expression.operator}".`,
            path: `workflows[${wIdx}].nodes[${nIdx}].expression.operator`
          });
        }
      }
    });

    // Verify all edge targets resolve to valid node IDs (including terminals)
    const incomingEdges = new Map<string, number>();
    workflow.edges.forEach((edge, eIdx) => {
      if (!nodeIds.has(edge.from)) {
        errors.push({
          type: 'semantic',
          severity: 'error',
          message: `Edge from "${edge.from}" targets non-existent source node ID in workflow "${workflow.name}".`,
          path: `workflows[${wIdx}].edges[${eIdx}].from`
        });
      }
      if (!nodeIds.has(edge.to)) {
        errors.push({
          type: 'semantic',
          severity: 'error',
          message: `Edge to "${edge.to}" targets non-existent destination node ID in workflow "${workflow.name}".`,
          path: `workflows[${wIdx}].edges[${eIdx}].to`
        });
      } else {
        incomingEdges.set(edge.to, (incomingEdges.get(edge.to) || 0) + 1);
      }
    });

    // Check for unreachable non-entry nodes
    const entryNodes = workflow.nodes.filter(n => n.type === 'trigger' || n.id === 's1' || n.id === 'exp_1');
    const firstNodeId = entryNodes[0]?.id || workflow.nodes[0]?.id;

    workflow.nodes.forEach((node) => {
      if (node.id !== firstNodeId && !incomingEdges.has(node.id)) {
        warnings.push({
          type: 'semantic',
          severity: 'warning',
          message: `Node "${node.id}" (${node.label || node.action}) appears disconnected with no incoming edges.`,
          path: `workflows[${wIdx}].nodes.${node.id}`
        });
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      entityCount: ir.entities.length,
      nodeCount: totalNodes,
      executionModes
    }
  };
}
