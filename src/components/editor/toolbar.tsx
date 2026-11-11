import { $createCodeNode } from '@lexical/code'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode, REMOVE_LIST_COMMAND } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type TextFormatType,
} from 'lexical'
import { useCallback, useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { PhArrowClockwise } from '@/components/icons/ph/arrow-clockwise'
import { PhArrowCounterClockwise } from '@/components/icons/ph/arrow-counter-clockwise'
import { PhCode } from '@/components/icons/ph/code'
import { PhCodeBlock } from '@/components/icons/ph/code-block'
import { PhLink } from '@/components/icons/ph/link'
import { PhListBullets } from '@/components/icons/ph/list-bullets'
import { PhListNumbers } from '@/components/icons/ph/list-numbers'
import { PhParagraph } from '@/components/icons/ph/paragraph'
import { PhQuotes } from '@/components/icons/ph/quotes'
import { PhTable } from '@/components/icons/ph/table'
import { PhTextB } from '@/components/icons/ph/text-b'
import { PhTextHThree } from '@/components/icons/ph/text-h-three'
import { PhTextHTwo } from '@/components/icons/ph/text-h-two'
import { PhTextItalic } from '@/components/icons/ph/text-italic'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type Block = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'quote' | 'code' | 'other'

export function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [block, setBlock] = useState<Block>('paragraph')
  const [formats, setFormats] = useState<Set<TextFormatType>>(new Set())
  const [isLink, setIsLink] = useState(false)

  const refresh = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setFormats(new Set((['bold', 'italic', 'code'] as const).filter((f) => selection.hasFormat(f))))
    const anchor = selection.anchor.getNode()
    setIsLink(!!$findMatchingParent(anchor, $isLinkNode))

    const element = $findMatchingParent(anchor, (n) => {
      const parent = n.getParent()
      return parent !== null && $isRootOrShadowRoot(parent)
    })
    if (!element) return
    if ($isListNode(element)) {
      const list = $getNearestNodeOfType(anchor, ListNode)
      setBlock((list ?? element).getListType() === 'number' ? 'number' : 'bullet')
    } else if ($isHeadingNode(element)) {
      setBlock(element.getTag() as Block)
    } else {
      const type = element.getType()
      setBlock(type === 'paragraph' || type === 'quote' || type === 'code' ? type : 'other')
    }
  }, [])

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(refresh)),
        editor.registerCommand(CAN_UNDO_COMMAND, (v) => (setCanUndo(v), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_REDO_COMMAND, (v) => (setCanRedo(v), false), COMMAND_PRIORITY_LOW),
      ),
    [editor, refresh],
  )

  const setBlockType = (target: Block) =>
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      // Toggling the active block type turns it back into a paragraph.
      const next = block === target ? 'paragraph' : target
      if (next === 'paragraph') $setBlocksType(selection, () => $createParagraphNode())
      else if (next === 'h2' || next === 'h3') $setBlocksType(selection, () => $createHeadingNode(next))
      else if (next === 'quote') $setBlocksType(selection, () => $createQuoteNode())
      else if (next === 'code') $setBlocksType(selection, () => $createCodeNode())
    })

  const toggleList = (type: 'bullet' | 'number') => {
    if (block === type) editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    else editor.dispatchCommand(type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)
  }

  const toggleLink = () => {
    if (isLink) return editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    const url = window.prompt('Link URL', 'https://')
    if (url && /^(https?:|mailto:|\/)/.test(url)) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper-soft px-2 py-1.5">
      <Btn icon={PhArrowCounterClockwise} label="Undo (⌘Z)" disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} />
      <Btn icon={PhArrowClockwise} label="Redo (⌘⇧Z)" disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} />
      <Divider />
      <Btn icon={PhParagraph} label="Paragraph" active={block === 'paragraph'} onClick={() => setBlockType('paragraph')} />
      <Btn icon={PhTextHTwo} label="Heading (##)" active={block === 'h2'} onClick={() => setBlockType('h2')} />
      <Btn icon={PhTextHThree} label="Subheading (###)" active={block === 'h3'} onClick={() => setBlockType('h3')} />
      <Divider />
      <Btn icon={PhTextB} label="Bold (⌘B)" active={formats.has('bold')} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} />
      <Btn icon={PhTextItalic} label="Italic (⌘I)" active={formats.has('italic')} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} />
      <Btn icon={PhCode} label="Inline code (`)" active={formats.has('code')} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')} />
      <Btn icon={PhLink} label={isLink ? 'Remove link' : 'Link'} active={isLink} onClick={toggleLink} />
      <Divider />
      <Btn icon={PhListBullets} label="Bulleted list (-)" active={block === 'bullet'} onClick={() => toggleList('bullet')} />
      <Btn icon={PhListNumbers} label="Numbered list (1.)" active={block === 'number'} onClick={() => toggleList('number')} />
      <Btn icon={PhQuotes} label="Quote (>)" active={block === 'quote'} onClick={() => setBlockType('quote')} />
      <Btn icon={PhCodeBlock} label="Code block (```)" active={block === 'code'} onClick={() => setBlockType('code')} />
      <Btn
        icon={PhTable}
        label="Insert table"
        onClick={() => editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: '3', columns: '3', includeHeaders: { rows: true, columns: false } })}
      />
    </div>
  )
}

function Btn({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          // Keep focus (and the selection) in the editor.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(
            'grid size-8 place-items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30',
            active ? 'bg-brand-soft text-brand-dark' : 'text-ink-soft hover:bg-white hover:text-ink',
          )}
        >
          <Icon className="size-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-line" />
